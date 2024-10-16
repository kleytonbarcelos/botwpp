const axios = require('axios');
const { transcribeAudio, processMessage } = require('../services/openaiService');

// Lida com as mensagens recebidas no webhook
exports.handleWebhook = async (req, res) => {
    const { messageType, conversation, number } = req.body;

    if (messageType === 'conversation') {
        const response = await processMessage(conversation);
        sendResponse(number, response);
        res.status(200).send("Mensagem processada.");
    } else if (messageType === 'audioMessage') {
        res.redirect('/whatsapp/audio');
    } else {
        res.status(400).send("Tipo de mensagem não suportada.");
    }
};

// Lida com as mensagens de áudio
exports.handleAudioMessage = async (req, res) => {
    const base64Audio = req.body.base64; // Recebe o áudio em base64
    const transcribedText = await transcribeAudio(base64Audio);
    const response = await processMessage(transcribedText);
    sendResponse(req.body.number, response);
    res.status(200).send("Áudio processado.");
};

// Função para enviar resposta via API externa
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
