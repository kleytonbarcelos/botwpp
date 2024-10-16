const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const openai = require('openai');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

app.post('/whatsapp/webhook', async (req, res) => {
    try {
        console.log("Requisição recebida:", req.body);
        
        // Verifica se o corpo da requisição está no formato esperado
        if (Array.isArray(req.body) && req.body.length > 0 && req.body[0].data) {
            const { data } = req.body[0]; // Acessando o corpo do JSON

            const messageType = data.messageType;
            const number = data.key.remoteJid || 'Número não encontrado';

            if (messageType === 'conversation') {
                const messageText = data.message.conversation || "Mensagem vazia";
                const responseMessage = await processMessage(messageText);
                
                // Enviar a resposta para a API
                await sendResponse(number, responseMessage);
                res.status(200).send("Mensagem de texto processada e resposta enviada.");
            } else if (messageType === 'audioMessage') {
                // Processar áudio (exemplo simplificado)
                res.status(200).send("Mensagem de áudio recebida e processada.");
            } else {
                res.status(400).send("Tipo de mensagem não suportada.");
            }
        } else {
            console.log("Corpo da requisição inválido ou vazio.", req.body);
            res.status(400).send("Corpo da requisição inválido ou vazio.");
        }
    } catch (error) {
        console.error("Erro ao processar a requisição:", error);
        res.status(500).send("Erro ao processar a requisição.");
    }
});


// Configurando o servidor para rodar na porta 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
