const axios = require('axios');
const { transcribeAudio, processMessage } = require('../services/openaiService');

// Lida com a entrada JSON do webhook
exports.handleWebhook = async (req, res) => {
    try {
        const { data } = req.body[0]; // Acessando o corpo do JSON
        const messageType = data.messageType;
        const audioUrl = data.message.audioMessage.url;
        const number = data.key.remoteJid;

        if (messageType === 'audioMessage') {
            // Baixar o áudio e processar a transcrição
            const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            const base64Audio = Buffer.from(audioResponse.data, 'binary').toString('base64');
            
            const transcribedText = await transcribeAudio(base64Audio);
            const responseMessage = await processMessage(transcribedText);
            
            // Enviar a resposta para a API
            await sendResponse(number, responseMessage);
            res.status(200).send("Áudio processado e resposta enviada.");
        } else {
            res.status(400).send("Tipo de mensagem não suportada.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
};

// Função para enviar a resposta para o número
const sendResponse = async (number, message) => {
    await axios.post('https://evolution.alfredy.site/message/sendText/ns', {
        number,
        text: message
    }, {
        headers: {
            'apikey': '5E85CE1F721D-495B-8165-F57E35DF1D63'
        }
    });
};
