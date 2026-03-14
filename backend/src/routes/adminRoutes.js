const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.listUsers);
router.get('/users/:userId/transactions', adminController.getUserTransactions);

module.exports = router;