const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Listar categorias (apenas nomes e ícones)
router.get('/categorias', (req, res) => {
    db.all('SELECT id, nome, icone FROM categorias ORDER BY nome', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obter categoria com produtos (para a página de categoria)
router.get('/categorias/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM categorias WHERE id = $1', [id], (err, categoria) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada' });
        db.all('SELECT * FROM produtos WHERE categoria_id = $1 ORDER BY nome', [id], (err2, produtos) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ ...categoria, produtos });
        });
    });
});

module.exports = router;