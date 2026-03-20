const express = require('express');
const router = express.Router();
const db = require('../models/database');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const axios = require('axios');

const CI = process.env.MISTICPAY_CI;
const CS = process.env.MISTICPAY_CS;
const API_BASE = 'https://api.misticpay.com/api';

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

// ========== DASHBOARD ==========
router.get('/stats', async (req, res) => {
    try {
        const stats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    (SELECT COALESCE(SUM(saldo), 0) FROM usuarios) as saldo_total,
                    (SELECT COALESCE(SUM(total_adicionado), 0) FROM usuarios) as total_adicionado,
                    (SELECT COALESCE(SUM(total_gasto), 0) FROM usuarios) as total_gasto,
                    (SELECT COUNT(*) FROM transacoes) as total_transacoes,
                    (SELECT COUNT(*) FROM transacoes WHERE tipo = 'adicao') as total_adicoes,
                    (SELECT COUNT(*) FROM transacoes WHERE tipo = 'compra') as total_compras,
                    (SELECT COUNT(*) FROM usuarios) as total_usuarios
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        let misticpayBalance = 0;
        try {
            const response = await axios.get(`${API_BASE}/users/balance`, {
                headers: { 'ci': CI, 'cs': CS }
            });
            misticpayBalance = response.data.data?.balance || 0;
        } catch (error) {
            console.error('Erro ao buscar saldo MisticPay:', error.message);
        }

        res.json({
            ...stats,
            misticpay_balance: misticpayBalance
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

// ========== USUÁRIOS (listar com paginação) ==========
router.get('/users', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all(
        'SELECT id, username, email, discord, saldo, total_adicionado, total_gasto, is_admin, created_at FROM usuarios ORDER BY id LIMIT $1 OFFSET $2',
        [limit, offset],
        (err, users) => {
            if (err) return res.status(500).json({ error: 'Erro no banco' });

            db.get('SELECT COUNT(*) as total FROM usuarios', [], (err2, count) => {
                if (err2) return res.status(500).json({ error: 'Erro no banco' });
                res.json({
                    users,
                    total: count.total,
                    page,
                    totalPages: Math.ceil(count.total / limit)
                });
            });
        }
    );
});

// ========== TRANSAÇÕES DE UM USUÁRIO ==========
router.get('/users/:userId/transactions', (req, res) => {
    const userId = req.params.userId;
    db.all(
        'SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY created_at DESC',
        [userId],
        (err, transactions) => {
            if (err) return res.status(500).json({ error: 'Erro no banco' });
            res.json(transactions);
        }
    );
});

// ========== RANKING ==========
router.get('/ranking', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    db.all(`
        SELECT 
            u.id,
            u.username,
            u.email,
            u.total_adicionado,
            COUNT(t.id) as total_transacoes
        FROM usuarios u
        LEFT JOIN transacoes t ON u.id = t.usuario_id AND t.tipo = 'adicao' AND t.status_pagamento = 'COMPLETO'
        GROUP BY u.id
        ORDER BY u.total_adicionado DESC
        LIMIT $1
    `, [limit], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro no banco' });
        res.json(rows);
    });
});

// ========== AÇÕES DO USUÁRIO ==========
// Excluir usuário
router.delete('/users/:userId', (req, res) => {
    const userId = req.params.userId;
    db.run('DELETE FROM transacoes WHERE usuario_id = $1', [userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run('DELETE FROM usuarios WHERE id = $1', [userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json({ message: 'Usuário excluído com sucesso' });
        });
    });
});

// Alterar senha
router.put('/users/:userId/password', (req, res) => {
    const { newPassword } = req.body;
    const userId = req.params.userId;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Erro ao criar hash' });
        db.run('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json({ message: 'Senha alterada com sucesso' });
        });
    });
});

// Adicionar saldo
router.put('/users/:userId/add-balance', (req, res) => {
    const { amount } = req.body;
    const userId = req.params.userId;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });
    db.run('UPDATE usuarios SET saldo = saldo + $1, total_adicionado = total_adicionado + $1 WHERE id = $2', [amount, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: `R$ ${amount.toFixed(2)} adicionado com sucesso` });
    });
});

// Remover saldo
router.put('/users/:userId/remove-balance', (req, res) => {
    const { amount } = req.body;
    const userId = req.params.userId;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });
    db.run('UPDATE usuarios SET saldo = saldo - $1, total_gasto = total_gasto + $1 WHERE id = $2 AND saldo >= $1', [amount, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(400).json({ error: 'Saldo insuficiente ou usuário não encontrado' });
        res.json({ message: `R$ ${amount.toFixed(2)} removido com sucesso` });
    });
});

// Tornar admin / remover admin
router.put('/users/:userId/toggle-admin', (req, res) => {
    const { is_admin } = req.body;
    const userId = req.params.userId;
    db.run('UPDATE usuarios SET is_admin = $1 WHERE id = $2', [is_admin ? 1 : 0, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: `Administrador: ${is_admin ? 'ativado' : 'desativado'}` });
    });
});

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
    const slug = generateSlug(nome) + '-' + Date.now();
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

// ========== SAQUE ==========
router.post('/withdraw', async (req, res) => {
    try {
        const { amount, pixKey, pixKeyType, description } = req.body;

        if (!amount || amount < 5) {
            return res.status(400).json({ error: 'Valor mínimo de R$ 5,00' });
        }
        if (!pixKey || !pixKeyType) {
            return res.status(400).json({ error: 'Chave PIX e tipo são obrigatórios' });
        }

        const balanceResponse = await axios.get(`${API_BASE}/users/balance`, {
            headers: { 'ci': CI, 'cs': CS }
        });
        const availableBalance = balanceResponse.data.data?.balance || 0;

        if (amount > availableBalance) {
            return res.status(400).json({ error: 'Saldo insuficiente na conta MisticPay' });
        }

        const withdrawResponse = await axios.post(`${API_BASE}/transactions/withdraw`, {
            amount,
            pixKey,
            pixKeyType,
            description: description || `Saque admin - ${new Date().toLocaleString()}`
        }, {
            headers: {
                'ci': CI,
                'cs': CS,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            message: 'Saque realizado com sucesso',
            data: withdrawResponse.data
        });

    } catch (error) {
        console.error('Erro ao realizar saque:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao processar saque' });
    }
});

module.exports = router;