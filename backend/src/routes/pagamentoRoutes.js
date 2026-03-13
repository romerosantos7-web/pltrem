const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/criar-pix', authMiddleware, pagamentoController.criarPix);
router.post('/webhooks/misticpay', pagamentoController.webhookMisticpay);

module.exports = router;