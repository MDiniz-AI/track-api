import 'dotenv/config';
import express from 'express';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authMiddleware from './authMiddleware.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from 'multer';
import cors from 'cors';
import cron from 'node-cron';
import { getLatestStatus } from './trackingService.js';

const app = express();
const port = 3000;
const sql = postgres(process.env.DATABASE_URL);
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(cors());

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ message: 'E-mail e senha são obrigatórios.' });
    }
    const userExists = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (userExists.length > 0) {
      return res.status(409).send({ message: 'Este e-mail já está em uso.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email, created_at
    `;
    res.status(201).send({ 
      message: 'Usuário criado com sucesso!', 
      user: newUser[0] 
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ message: 'E-mail e senha são obrigatórios.' });
    }
    const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (userResult.length === 0) {
      return res.status(401).send({ message: 'Credenciais inválidas.' });
    }
    const user = userResult[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).send({ message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).send({
      message: 'Login bem-sucedido!',
      token: token
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
});

app.post('/packages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Agora pegamos TODOS os novos campos que o frontend envia
    const { tracking_code, title, carrier, store_name } = req.body;

    const upperCaseTrackingCode = tracking_code ? tracking_code.toUpperCase() : null;

    // Validação básica
    if (!upperCaseTrackingCode || !title) {
      return res.status(400).send({ message: 'Código de rastreio e título são obrigatórios.' });
    }

    // 2. ATUALIZADO: A query agora inclui a nova coluna 'store_name' tanto
    // na lista de colunas quanto na lista de valores.
    const createdPackage = await sql`
      INSERT INTO packages (user_id, tracking_code, title, carrier, store_name)
      VALUES (${userId}, ${upperCaseTrackingCode}, ${title}, ${carrier}, ${store_name})
      RETURNING *
    `;

    res.status(201).send({
      message: 'Pacote adicionado com sucesso!',
      package: createdPackage[0] // Usando a variável corrigida
    });

  } catch (error) {
    console.error("Erro ao adicionar pacote:", error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
});

app.post('/packages/ocr', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    // Validação: Verifica se um arquivo foi realmente enviado.
    if (!req.file) {
      return res.status(400).send({ message: 'Nenhum arquivo de imagem enviado.' });
    }

    console.log("Imagem recebida, enviando para a IA...");

    // O prompt detalhado que instrui a IA sobre o que fazer
const prompt = `
### CONTEXTO ###
Você é um sistema de software de back-end. Sua única função é analisar imagens de páginas de compras online e extrair dados estruturados. A precisão e a consistência do formato de saída são críticas para o funcionamento do sistema que te consome.

### TAREFA ###
Analise a imagem fornecida e extraia as seguintes informações, seguindo as regras de formatação estritamente.

### INSTRUÇÕES DE EXTRAÇÃO ###
1.  **tracking_code**: Encontre o código de rastreio. É uma combinação de letras e números. Procure por termos como "Código de Rastreio", "Rastreamento", ou sequências alfanuméricas isoladas.
2.  **title**: Encontre o nome principal do produto ou um título descritivo para a compra.
3.  **carrier**: Encontre o nome da transportadora (ex: "Correios", "Jadlog", "Loggi"). Procure por termos como "Transportadora", "Entregue por".
4.  **store_name**: Encontre o nome da loja/varejista (ex: "Amazon", "Mercado Livre"). Geralmente está em um lugar de destaque, como o topo da página.
5.  **estimated_delivery_date**: Encontre a data prevista para a entrega. Procure por "Chega em", "Previsão de entrega", "Entrega estimada". Formate a data como DD-MM-AAAA.
6.  **status**: Encontre o status atual da entrega (ex: "A caminho", "Entregue", "Preparando pedido").

### REGRAS DE FORMATAÇÃO ###
- A sua saída deve ser EXCLUSIVAMENTE um objeto JSON válido, sem nenhum texto, explicação ou markdown como \`\`\`json.
- O JSON deve conter todas as chaves listadas acima.
- Se uma informação não for encontrada de forma clara e inequívoca na imagem, o valor da chave correspondente deve ser OBRIGATORIAMENTE \`null\`. Não invente informações.

### EXEMPLOS ###

# Exemplo 1: Imagem com todas as informações
# Saída esperada:
# {
#   "tracking_code": "QP123456789BR",
#   "title": "Smart Lâmpada Wi-Fi Positivo",
#   "carrier": "Correios",
#   "store_name": "Amazon.com.br",
#   "estimated_delivery_date": "20-10-2025",
#   "status": "Enviado"
# }

# Exemplo 2: Imagem sem transportadora visível
# Saída esperada:
# {
#   "tracking_code": "ML987654321",
#   "title": "Capa de Silicone para Celular",
#   "carrier": null,
#   "store_name": "Mercado Livre",
#   "estimated_delivery_date": "22-10-2025",
#   "status": "Preparando"
# }

### INÍCIO DA ANÁLISE ###
Agora, analise a imagem fornecida e gere o objeto JSON correspondente.
`;

    // Prepara a imagem para ser enviada para a IA
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"), // Converte a imagem para texto Base64
        mimeType: req.file.mimetype, // Informa o tipo da imagem (png, jpeg, etc.)
      },
    };

    // Envia o prompt e a imagem para o Gemini e espera a resposta
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("Resposta da IA recebida:", responseText);

    // Limpa a resposta para garantir que temos apenas o JSON
    const jsonResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Converte o texto JSON em um objeto JavaScript
    const data = JSON.parse(jsonResponse);

    // Envia os dados extraídos de volta para o cliente
    res.status(200).send(data);

  } catch (error) {
    console.error("Erro no processamento da IA:", error);
    res.status(500).send({ message: 'Erro ao processar a imagem com a IA.' });
  }
});

app.get('/packages', authMiddleware, async (req, res) => {
  try {
    // 1. O nosso "Guarda" (authMiddleware) já verificou o token e nos deu o ID do usuário.
    const userId = req.user.userId;

    // 2. Fazemos uma busca na tabela 'packages' por todas as linhas
    //    que pertencem a este usuário (WHERE user_id = ...).
    //    Ordenamos por 'created_at' para mostrar os mais recentes primeiro.
    const packages = await sql`
      SELECT * FROM packages 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;

    // 3. Enviamos a lista de pacotes encontrada (pode ser uma lista vazia, e está tudo bem).
    res.status(200).send(packages);

  } catch (error) {
    console.error("Erro ao buscar pacotes:", error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
});

app.put('/packages/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Pegamos o ID do usuário (do token) e o ID do pacote (da URL).
    const userId = req.user.userId;
    const packageId = req.params.id;

    // 2. Pegamos os novos dados que o frontend enviou no corpo da requisição.
    const { title, tracking_code, carrier, store_name } = req.body;

    const upperCaseTrackingCode = tracking_code ? tracking_code.toUpperCase() : null;

    // Validação básica
    if (!upperCaseTrackingCode || !title) {
      return res.status(400).send({ message: 'Código de rastreio e título são obrigatórios.' });
    }

    // 3. A MÁGICA DA SEGURANÇA: Executamos a atualização no banco.
    //    A query SQL vai atualizar a linha com base no 'packageId'.
    //    A cláusula "AND user_id = ${userId}" é CRUCIAL: ela garante
    //    que um usuário só possa editar um pacote que REALMENTE pertence a ele.
    const updatedPackage = await sql`
      UPDATE packages 
      SET 
        title = ${title},
        tracking_code = ${tracking_code},
        carrier = ${carrier},
        store_name = ${store_name},
        updated_at = NOW()
      WHERE 
        id = ${packageId} AND user_id = ${userId}
      RETURNING *
    `;

    // 4. Verificamos se algo foi realmente atualizado.
    //    Se o 'updatedPackage' estiver vazio, significa que o pacote não foi encontrado
    //    ou não pertencia ao usuário.
    if (updatedPackage.length === 0) {
      return res.status(404).send({ message: 'Pacote não encontrado ou não pertence a este usuário.' });
    }

    // 5. Enviamos de volta o pacote com os dados atualizados.
    res.status(200).send(updatedPackage[0]);

  } catch (error) {
    console.error("Erro ao atualizar pacote:", error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
});

app.delete('/packages/:id', authMiddleware, async (req, res) => {
  try {
    // 1. Pegamos o ID do usuário (do token) e o ID do pacote (da URL).
    const userId = req.user.userId;
    const packageId = req.params.id;

    // 2. A MÁGICA DA SEGURANÇA: Executamos o comando DELETE.
    //    A cláusula "AND user_id = ${userId}" é CRUCIAL: ela garante
    //    que um usuário só possa deletar um pacote que pertence a ele.
    const deleteResult = await sql`
      DELETE FROM packages 
      WHERE 
        id = ${packageId} AND user_id = ${userId}
    `;

    // 3. Verificamos se alguma linha foi realmente deletada.
    //    A propriedade 'count' nos diz quantas linhas foram afetadas.
    if (deleteResult.count === 0) {
      // Se count for 0, o pacote não foi encontrado ou não pertencia ao usuário.
      return res.status(404).send({ message: 'Pacote não encontrado ou não pertence a este usuário.' });
    }

    // 4. Enviamos uma resposta de sucesso. 
    //    O status 204 No Content é o padrão para uma deleção bem-sucedida,
    //    indicando que a operação funcionou e não há conteúdo para retornar.
    res.sendStatus(204);

  } catch (error) {
    console.error("Erro ao deletar pacote:", error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
});

// Em backend/index.js, dentro do cron.schedule

// ...
cron.schedule('0 * * * *', async () => { // Garanta que está no modo de 1 minuto para teste
  console.log('🤖 Iniciando tarefa agendada de atualização de status...');
  
  try {
    const packagesToUpdate = await sql`
      SELECT * FROM packages WHERE is_delivered = false
    `;

    console.log(`Encontrados ${packagesToUpdate.length} pacotes para verificar.`);

    // O loop começa aqui
    for (const pkg of packagesToUpdate) {
      // ✅ ESPIÃO 1: O que estamos tentando verificar?
      console.log(`\n-- Verificando pacote: "${pkg.title}" (Código: ${pkg.tracking_code})`);

      // Chama o cérebro do robô
      const newStatus = await getLatestStatus(pkg.tracking_code);

      // ✅ ESPIÃO 2: O que a API nos disse?
      console.log(`-- Status recebido da API: "${newStatus}"`);
      // ✅ ESPIÃO 3: Qual é o status que já temos salvo no banco?
      console.log(`-- Status atual no banco: "${pkg.status}"`);

      // A lógica de decisão
      if (newStatus && newStatus !== pkg.status) {
        
        await sql`
          UPDATE packages
          SET 
            status = ${newStatus},
            is_delivered = ${newStatus.toLowerCase().includes('entregue')},
            updated_at = NOW()
          WHERE id = ${pkg.id}
        `;
        console.log(`✅ Pacote ${pkg.id} atualizado para: "${newStatus}"`);
      } else {
        // ✅ ESPIÃO 4: Por que não atualizamos?
        if (!newStatus) {
            console.log('❌ Nenhuma atualização: a API não retornou um novo status.');
        } else {
            console.log('➡️ Nenhuma atualização: o status recebido é o mesmo que já está no banco.');
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na tarefa agendada:', error);
  }

  console.log('🤖 Tarefa agendada de atualização finalizada.');
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});