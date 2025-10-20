// backend/trackingService.js

// 1. Importa a biblioteca que faz a "mágica" de consultar os Correios
import { rastrearEncomendas } from 'rastreio-correios';

// 2. Esta é a função principal do nosso serviço
// Ela é 'async' porque a consulta na internet pode demorar.
async function getLatestStatus(trackingCode) {
  try {
    // 3. Chama a biblioteca com o código de rastreio.
    //    A biblioteca espera uma lista de códigos, então passamos nosso código dentro de um array [].
    const result = await rastrearEncomendas([trackingCode]);

    // 4. A biblioteca retorna um resultado complexo. Vamos extrair o que importa.
    //    Verificamos se o resultado existe e se tem eventos (o histórico de status).
    if (result && result.length > 0 && result[0].eventos && result[0].eventos.length > 0) {
      
      // 5. O primeiro evento (índice 0) é sempre o mais recente.
      const latestEvent = result[0].eventos[0];
      
      // 6. Retornamos a descrição do status (ex: "Objeto postado", "Objeto saiu para entrega ao destinatário").
      return latestEvent.descricao;
    }

    // Se não encontrou eventos, retorna null.
    return null;

  } catch (error) {
    // Se a biblioteca der um erro (ex: código inválido, site dos Correios fora do ar),
    // nós capturamos o erro e o registramos no nosso console.
    console.error(`Erro ao rastrear o código ${trackingCode}:`, error.message);
    // Retornamos null para indicar que a busca falhou.
    return null;
  }
}

// 7. Exportamos nossa função para que outros arquivos (como o nosso robô) possam usá-la.
export { getLatestStatus };