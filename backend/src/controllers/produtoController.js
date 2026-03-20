const db = require('../models/database');

// Listar produtos de uma categoria (público)
exports.listarPorCategoria = (req, res) => {
    const catId = req.params.categoriaId;
    db.all('SELECT * FROM produtos WHERE categoria_id = $1 ORDER BY nome', [catId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Criar produto (admin)
exports.criar = (req, res) => {
    const { categoria_id, nome, preco, preco_antigo, info, icone } = req.body;
    if (!categoria_id || !nome || !preco) {
        return res.status(400).json({ error: 'categoria_id, nome e preco são obrigatórios' });
    }
    db.run(
        `INSERT INTO produtos (categoria_id, nome, preco, preco_antigo, info, icone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [categoria_id, nome, preco, preco_antigo, info, icone || 'fa-box'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Produto criado' });
        }
    );
};

// Atualizar produto (admin)
exports.atualizar = (req, res) => {
    const id = req.params.id;
    const { nome, preco, preco_antigo, info, icone } = req.body;
    db.run(
        `UPDATE produtos SET nome = $1, preco = $2, preco_antigo = $3, info = $4, icone = $5 WHERE id = $6`,
        [nome, preco, preco_antigo, info, icone, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
            res.json({ message: 'Produto atualizado' });
        }
    );
};

// Deletar produto (admin)
exports.deletar = (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM produtos WHERE id = $1', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json({ message: 'Produto deletado' });
    });
};