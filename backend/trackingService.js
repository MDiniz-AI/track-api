// backend/trackingService.js - VERSÃO FINAL (WONCA LABS API)

async function getLatestStatus(trackingCode) {
  // 1. Pegamos a chave de API do nosso .env
  const apiKey = process.env.WONCA_API_KEY;

  if (!apiKey) {
    console.error('ERRO: A chave da API da Wonca Labs (WONCA_API_KEY) não está configurada no .env');
    return 'Falha na configuração';
  }

  const url = 'https://api-labs.wonca.com.br/wonca.labs.v1.LabsService/Track';

  try {
    // 2. Fazemos a chamada POST, exatamente como na documentação
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // O formato da autorização é 'Apikey SEU_TOKEN'
        'Authorization': `Apikey ${apiKey}`
      },
      // O corpo da requisição é um JSON com a chave 'code'
      body: JSON.stringify({ "code": trackingCode })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Erro da API Wonca Labs para o código ${trackingCode}:`, data);
      return 'Falha na API';
    }
    
    // 3. Analisamos a resposta para pegar o status mais recente.
    //    A API retorna uma lista 'events'. O primeiro (índice 0) é o mais novo.
    if (data && data.events && data.events.length > 0) {
      const latestEvent = data.events[0];
      
      // 4. Retornamos o campo 'label' do evento.
      return latestEvent.label;
    }

    return 'Status não encontrado';

  } catch (error) {
    console.error(`Erro ao conectar com a API da Wonca Labs para o código ${trackingCode}:`, error.message);
    return 'Falha ao rastrear';
  }
}

export { getLatestStatus };