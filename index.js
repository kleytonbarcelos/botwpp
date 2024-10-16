const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const openai = require('openai');

// Middleware
app.use(bodyParser.json({ limit: '50mb' })); // Aumenta o limite para aceitar payloads maiores
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Função para enviar a resposta via API
const sendResponse = async (number, message) => {
    console.log(`Enviando resposta para ${number}: ${message}`);
    try {
        await axios.post('https://evolution.alfredy.site/message/sendText/ns', {
            number,
            text: message
        }, {
            headers: {
                'apikey': '5E85CE1F721D-495B-8165-F57E35DF1D63'
            }
        });
        console.log("Resposta enviada com sucesso.");
    } catch (error) {
        console.error("Erro ao enviar resposta:", error.message);
    }
};

// Processa o texto usando OpenAI
const processMessage = async (message) => {
    console.log(`Processando mensagem de texto: ${message}`);
    try {
        const response = await openai.Completions.create({
            prompt: message,
            max_tokens: 100
        });
        return response.choices[0].text.trim();
    } catch (error) {
        console.error("Erro ao processar mensagem de texto:", error.message);
        return "Desculpe, não consegui processar sua mensagem.";
    }
};

// Transcreve o áudio com OpenAI
const transcribeAudio = async (base64Audio) => {
    console.log("Transcrevendo áudio...");
    try {
        const response = await openai.Audio.transcriptions({
            file: base64Audio,
            model: "whisper-1"
        });
        return response.text;
    } catch (error) {
        console.error("Erro ao transcrever áudio:", error.message);
        return "Desculpe, não consegui transcrever o áudio.";
    }
};

// Processa a imagem (não diretamente suportado, precisaria de uma integração como OCR ou API de reconhecimento de imagem)
const processImage = async (imageUrl) => {
    console.log("Processando imagem...");
    return "Desculpe, ainda não posso interpretar imagens.";
};

// Lida com a entrada JSON do webhook
app.post('/whatsapp/webhook', async (req, res) => {
    try {
        console.log("Requisição recebida:", JSON.stringify(req.body, null, 2));

        // Verifica se o corpo da requisição contém os dados esperados
        if (!req.body || !Array.isArray(req.body) || req.body.length === 0 || !req.body[0].data) {
            console.error("Corpo da requisição inválido ou vazio.");
            return res.status(400).send("Corpo da requisição inválido ou vazio.");
        }

        const { data } = req.body[0]; // Acessando o corpo do JSON
        const messageType = data.messageType;
        const number = data.key.remoteJid;

        if (messageType === 'conversation') {
            const conversationText = data.message.conversation;
            console.log(`Texto recebido: ${conversationText}`);
            const responseMessage = await processMessage(conversationText);
            await sendResponse(number, responseMessage);
            res.status(200).send("Texto processado e resposta enviada.");
        } else if (messageType === 'audioMessage') {
            const audioUrl = data.message.audioMessage.url;
            console.log(`Áudio recebido: ${audioUrl}`);
            const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            const base64Audio = Buffer.from(audioResponse.data, 'binary').toString('base64');
            const transcribedText = await transcribeAudio(base64Audio);
            const responseMessage = await processMessage(transcribedText);
            await sendResponse(number, responseMessage);
            res.status(200).send("Áudio processado e resposta enviada.");
        } else if (messageType === 'imageMessage') {
            const imageUrl = data.message.imageMessage.url;
            console.log(`Imagem recebida: ${imageUrl}`);
            const responseMessage = await processImage(imageUrl);
            await sendResponse(number, responseMessage);
            res.status(200).send("Imagem processada e resposta enviada.");
        } else {
            console.log("Tipo de mensagem não suportada.");
            await sendResponse(number, "Não consegui entender o tipo de mensagem. Pode tentar novamente?");
            res.status(400).send("Tipo de mensagem não suportada.");
        }
    } catch (error) {
        console.error("Erro ao processar a requisição:", error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});

// Configurando o servidor para rodar na porta 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
