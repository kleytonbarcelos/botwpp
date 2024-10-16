const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Função para enviar a resposta para o número via API
const sendResponse = async (number, message) => {
    console.log(`Enviando resposta para o número: ${number}, Mensagem: ${message}`);
    await axios.post('https://evolution.alfredy.site/message/sendText/ns', {
        number,
        text: message
    }, {
        headers: {
            'apikey': '5E85CE1F721D-495B-8165-F57E35DF1D63'
        }
    });
    console.log('Resposta enviada com sucesso.');
};

// Processa o texto usando o OpenAI
const processMessage = async (message) => {
    console.log(`Processando mensagem no OpenAI: ${message}`);
    const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
        prompt: message,
        max_tokens: 100
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });
    const result = response.data.choices[0].text.trim();
    console.log(`Resposta do OpenAI: ${result}`);
    return result;
};

// Transcreve o áudio com OpenAI
const transcribeAudio = async (base64Audio) => {
    console.log('Transcrevendo áudio com OpenAI');
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', {
        file: base64Audio,
        model: "whisper-1"
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });
    console.log('Áudio transcrito com sucesso:', response.data.text);
    return response.data.text;
};

// Lida com a entrada JSON do webhook
app.post('/whatsapp/webhook', async (req, res) => {
    try {
        console.log('Requisição recebida:', JSON.stringify(req.body, null, 2));
        if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
            console.error('Corpo da requisição inválido ou vazio');
            return res.status(400).send('Corpo da requisição inválido ou vazio');
        }

        const { data } = req.body[0]; // Acessando o corpo do JSON
        console.log('Dados extraídos do corpo da requisição:', data);

        const messageType = data.messageType;
        const audioUrl = data.message.audioMessage.url;
        const number = data.key.remoteJid;

        console.log(`Tipo de mensagem: ${messageType}, URL do áudio: ${audioUrl}, Número: ${number}`);

        if (messageType === 'audioMessage') {
            // Baixar o áudio e processar a transcrição
            const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            console.log('Áudio baixado com sucesso.');

            const base64Audio = Buffer.from(audioResponse.data, 'binary').toString('base64');
            console.log('Áudio convertido para base64.');

            const transcribedText = await transcribeAudio(base64Audio);
            const responseMessage = await processMessage(transcribedText);

            // Enviar a resposta para a API
            await sendResponse(number, responseMessage);
            res.status(200).send("Áudio processado e resposta enviada.");
        } else {
            console.log('Tipo de mensagem não suportada:', messageType);
            res.status(400).send("Tipo de mensagem não suportada.");
        }
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});

// Configurando o servidor para rodar na porta 3000 ou a porta definida no ambiente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
