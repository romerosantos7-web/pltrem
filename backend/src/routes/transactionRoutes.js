const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/add-saldo', authMiddleware, transactionController.addSaldo);

module.exports = router;