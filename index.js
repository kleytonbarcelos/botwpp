const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const OpenAI = require('openai');

// Inicialize o cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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
const processText = async (message) => {
    console.log(`Processando mensagem no OpenAI: ${message}`);
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
        max_tokens: 100
    });
    const result = response.choices[0].message.content.trim();
    console.log(`Resposta do OpenAI: ${result}`);
    return result;
};

// Transcreve o áudio com Whisper API (OpenAI)
const transcribeAudio = async (base64Audio) => {
    console.log('Transcrevendo áudio com Whisper API');
    const response = await openai.audio.transcriptions.create({
        file: base64Audio,
        model: "whisper-1"
    });
    console.log('Áudio transcrito com sucesso:', response.text);
    return response.text;
};

// Gera uma descrição de imagem com OpenAI
const describeImage = async (base64Image) => {
    console.log('Gerando descrição para a imagem com OpenAI');
    const response = await openai.images.generate({
        prompt: "Describe the content of the image",
        images: [{ data: base64Image }],
        max_tokens: 100
    });
    const description = response.choices[0].message.content.trim();
    console.log('Descrição da imagem gerada:', description);
    return description;
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
        const number = data.key.remoteJid;

        console.log(`Tipo de mensagem: ${messageType}, Número: ${number}`);

        // Lida com diferentes tipos de mensagens
        if (messageType === 'audioMessage') {
            const audioUrl = data.message.audioMessage.url;
            console.log(`URL do áudio: ${audioUrl}`);

            // Baixar o áudio e processar a transcrição
            const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            const base64Audio = Buffer.from(audioResponse.data, 'binary').toString('base64');
            console.log('Áudio convertido para base64.');

            const transcribedText = await transcribeAudio(base64Audio);
            const responseMessage = await processText(transcribedText);

            // Enviar a resposta para a API
            await sendResponse(number, responseMessage);
            res.status(200).send("Áudio processado e resposta enviada.");

        } else if (messageType === 'conversation') {
            const text = data.message.conversation || data.message.text;
            console.log(`Mensagem de texto recebida: ${text}`);

            // Processar a mensagem de texto
            const responseMessage = await processText(text);

            // Enviar a resposta para a API
            await sendResponse(number, responseMessage);
            res.status(200).send("Texto processado e resposta enviada.");

        } else if (messageType === 'imageMessage') {
            const imageUrl = data.message.imageMessage.url;
            console.log(`URL da imagem recebida: ${imageUrl}`);

            // Baixar a imagem e convertê-la para base64
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
            console.log('Imagem convertida para base64.');

            // Gerar descrição da imagem com OpenAI
            const description = await describeImage(base64Image);

            // Enviar a descrição da imagem como resposta
            await sendResponse(number, description);
            res.status(200).send("Imagem processada e descrição enviada.");

        } else {
            console.log(`Tipo de mensagem não suportada: ${messageType}`);
            await sendResponse(number, "Desculpe, não consegui entender sua mensagem. Poderia tentar novamente?");
            res.status(400).send("Tipo de mensagem não suportada.");
        }
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});

// Configurando o servidor para rodar na porta 8080 ou a porta definida no ambiente
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
