const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Todas as rotas exigem autenticação e ser admin
router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminDashboardController.getDashboardStats);
router.get('/ranking', adminDashboardController.getRankingAdicoes);
router.post('/withdraw', adminDashboardController.adminWithdraw);

module.exports = router;