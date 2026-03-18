const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.listUsers);
router.get('/users/:userId/transactions', adminController.getUserTransactions);

// Novas rotas para ações
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/password', adminController.changePassword);
router.put('/users/:userId/add-balance', adminController.addBalance);
router.put('/users/:userId/remove-balance', adminController.removeBalance);
router.put('/users/:userId/toggle-admin', adminController.toggleAdmin);

module.exports = router;