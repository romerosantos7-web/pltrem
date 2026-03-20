const express = require('express');
const router = express.Router();
const db = require('../models/database');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Gerar slug a partir do nome
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Todas as rotas exigem autenticação e admin
router.use(authMiddleware, adminMiddleware);

// ========== CATEGORIAS ==========
router.get('/categorias', (req, res) => {
    db.all('SELECT * FROM categorias ORDER BY ordem, nome', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/categorias/:id', (req, res) => {
    db.get('SELECT * FROM categorias WHERE id = $1', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Categoria não encontrada' });
        res.json(row);
    });
});

router.post('/categorias', (req, res) => {
    const { nome, icone, titulo, subtitulo, descricao, ordem } = req.body;
    if (!nome || !titulo) {
        return res.status(400).json({ error: 'Nome e título são obrigatórios' });
    }
    const slug = generateSlug(nome);
    db.run(
        `INSERT INTO categorias (nome, slug, icone, titulo, subtitulo, descricao, ordem)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [nome, slug, icone || 'fa-gamepad', titulo, subtitulo, descricao, ordem || 0],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Slug já existe' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, message: 'Categoria criada' });
        }
    );
});

router.put('/categorias/:id', (req, res) => {
    const { nome, icone, titulo, subtitulo, descricao, ordem } = req.body;
    const slug = nome ? generateSlug(nome) : undefined;
    db.run(
        `UPDATE categorias SET
            nome = COALESCE($1, nome),
            slug = COALESCE($2, slug),
            icone = COALESCE($3, icone),
            titulo = COALESCE($4, titulo),
            subtitulo = COALESCE($5, subtitulo),
            descricao = COALESCE($6, descricao),
            ordem = COALESCE($7, ordem),
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [nome, slug, icone, titulo, subtitulo, descricao, ordem, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
            res.json({ message: 'Categoria atualizada' });
        }
    );
});

router.delete('/categorias/:id', (req, res) => {
    db.run('DELETE FROM categorias WHERE id = $1', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
        res.json({ message: 'Categoria excluída' });
    });
});

// ========== PRODUTOS ==========
router.get('/produtos', (req, res) => {
    const { categoria_id } = req.query;
    let sql = 'SELECT * FROM produtos';
    const params = [];
    if (categoria_id) {
        sql += ' WHERE categoria_id = $1';
        params.push(categoria_id);
    }
    sql += ' ORDER BY destaque DESC, nome';
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/produtos/:id', (req, res) => {
    db.get('SELECT * FROM produtos WHERE id = $1', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(row);
    });
});

router.post('/produtos', (req, res) => {
    const { categoria_id, nome, preco, preco_antigo, info, icone, destaque, ativo } = req.body;
    if (!categoria_id || !nome || !preco) {
        return res.status(400).json({ error: 'Categoria, nome e preço são obrigatórios' });
    }
    const slug = generateSlug(nome) + '-' + Date.now(); // para evitar duplicidade
    db.run(
        `INSERT INTO produtos (categoria_id, nome, slug, preco, preco_antigo, info, icone, destaque, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [categoria_id, nome, slug, preco, preco_antigo, info, icone || 'fa-box', destaque || false, ativo !== false],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Produto criado' });
        }
    );
});

router.put('/produtos/:id', (req, res) => {
    const { categoria_id, nome, preco, preco_antigo, info, icone, destaque, ativo } = req.body;
    db.run(
        `UPDATE produtos SET
            categoria_id = COALESCE($1, categoria_id),
            nome = COALESCE($2, nome),
            preco = COALESCE($3, preco),
            preco_antigo = COALESCE($4, preco_antigo),
            info = COALESCE($5, info),
            icone = COALESCE($6, icone),
            destaque = COALESCE($7, destaque),
            ativo = COALESCE($8, ativo),
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [categoria_id, nome, preco, preco_antigo, info, icone, destaque, ativo, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
            res.json({ message: 'Produto atualizado' });
        }
    );
});

router.delete('/produtos/:id', (req, res) => {
    db.run('DELETE FROM produtos WHERE id = $1', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json({ message: 'Produto excluído' });
    });
});

module.exports = router;