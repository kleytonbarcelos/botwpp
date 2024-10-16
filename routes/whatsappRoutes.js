const express = require('express');
const { handleWebhook, handleAudioMessage } = require('../controllers/whatsappController');
const router = express.Router();

router.post('/webhook', handleWebhook);
router.post('/audio', handleAudioMessage);

module.exports = router;
