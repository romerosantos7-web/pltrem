const express = require('express');
const router = express.Router();

// Exemplo: rota pública de status
router.get('/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date() });
});

module.exports = router;