const axios = require('axios');

// Processa o texto usando o OpenAI
exports.processMessage = async (message) => {
    const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
        prompt: message,
        max_tokens: 100
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    });
    return response.data.choices[0].text.trim();
};

// Transcreve o áudio com OpenAI
exports.transcribeAudio = async (base64Audio) => {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', {
        file: base64Audio,
        model: "whisper-1"
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    });
    return response.data.text;
};
