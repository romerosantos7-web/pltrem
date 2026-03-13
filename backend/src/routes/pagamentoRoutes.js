const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota para criar PIX (protegida)
router.post('/criar-pix', authMiddleware, pagamentoController.criarPix);

// Rota de webhook (pública)
router.post('/webhooks/misticpay', pagamentoController.webhookMisticpay);

module.exports = router;