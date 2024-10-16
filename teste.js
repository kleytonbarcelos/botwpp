const axios = require('axios');

const simulateMessage = async () => {
    const data = {
        event: 'messages.upsert',
        instance: 'ns',
        data: {
            key: {
                remoteJid: '5528999375289@s.whatsapp.net',
                fromMe: false,
                id: '3EB00F53C76BA058F4E810'
            },
            pushName: 'Kleyton Barcelos',
            message: {
                conversation: 'Teste de mensagem',
                messageContextInfo: {
                    deviceListMetadata: {
                        senderKeyHash: 'yWhOZF/fHL1jIA==',
                        senderTimestamp: '1728559963',
                        senderAccountType: 'E2EE',
                        receiverAccountType: 'E2EE',
                        recipientKeyHash: '0CYMEWOdlePI7g==',
                        recipientTimestamp: '1728997079'
                    },
                    deviceListMetadataVersion: 2
                }
            },
            messageType: 'conversation',
            messageTimestamp: 1729087683,
            instanceId: '51a37114-54d8-4d1c-99ce-2dd075c6daa7',
            source: 'web'
        },
        destination: 'http://localhost:8080/whatsapp/webhook',
        date_time: new Date().toISOString(),
        sender: '5528999070750@s.whatsapp.net',
        server_url: 'https://evolution.alfredy.site'
    };

    try {
        const response = await axios.post('http://localhost:8080/whatsapp/webhook', data, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': '5E85CE1F721D-495B-8165-F57E35DF1D63'
            }
        });
        console.log('Resposta do servidor:', response.data);
    } catch (error) {
        console.error('Erro ao simular a mensagem:', error.response ? error.response.data : error.message);
    }
};

simulateMessage();
