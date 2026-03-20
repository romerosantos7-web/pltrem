const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.get('/', (req, res) => {
    db.all('SELECT id, nome, slug, icone, titulo, subtitulo, descricao FROM categorias ORDER BY ordem, nome', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:slug', (req, res) => {
    db.get('SELECT * FROM categorias WHERE slug = $1', [req.params.slug], (err, categoria) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada' });
        db.all('SELECT id, nome, preco, preco_antigo, info, icone FROM produtos WHERE categoria_id = $1 AND ativo = true', [categoria.id], (err, produtos) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ categoria, produtos });
        });
    });
});

module.exports = router;