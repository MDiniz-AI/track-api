// setupDatabase.js - VERSÃO REFATORADA E CORRIGIDA

// Carrega as variáveis de ambiente. ESSA LINHA CONTINUA SENDO CRUCIAL.
import 'dotenv/config'; 

// Importa a nova biblioteca 'postgres'
import postgres from 'postgres';

async function setupDatabase() {
  console.log("Iniciando a configuração do banco de dados...");

  const connectionString = process.env.DATABASE_URL;

  // Teste para garantir que a "chave" foi lida
  if (!connectionString) {
    console.error("ERRO FATAL: A variável DATABASE_URL não foi encontrada no arquivo .env!");
    console.error("Por favor, verifique se o arquivo .env existe e está correto.");
    return; // Encerra a execução se a chave não for encontrada
  }

  console.log("Conectando ao banco de dados com a nova biblioteca...");

  try {
    // Conecta ao banco de dados usando a URL
    const sql = postgres(connectionString);

    // Executa os comandos SQL para criar as tabelas
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tracking_code VARCHAR(100) NOT NULL,
          carrier VARCHAR(100),
          title VARCHAR(255) NOT NULL,
          last_status VARCHAR(255),
          is_delivered BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_history (
          id BIGSERIAL PRIMARY KEY,
          package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
          status_description VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          event_date TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log("Tabelas criadas com sucesso (ou já existiam)!");

    // Fecha a conexão
    await sql.end();
    console.log("Conexão com o banco de dados encerrada.");

  } catch (error) {
    console.error("Erro ao configurar o banco de dados:", error.message);
  } finally {
    console.log("Configuração finalizada.");
  }
}

setupDatabase();