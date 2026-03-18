// backend/src/controllers/adminController.js
const db = require('../models/database');
const bcrypt = require('bcryptjs');

// Listar usuários com paginação
exports.listUsers = (req, res) => {
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
                res.json({ users, total: count.total, page, totalPages: Math.ceil(count.total / limit) });
            });
        }
    );
};

// Ver transações de um usuário específico
exports.getUserTransactions = (req, res) => {
    const userId = req.params.userId;
    db.all('SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro no banco' });
        res.json(rows);
    });
};

// Excluir usuário
exports.deleteUser = (req, res) => {
    const userId = req.params.userId;
    db.run('DELETE FROM transacoes WHERE usuario_id = $1', [userId], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao excluir transações' });
        db.run('DELETE FROM usuarios WHERE id = $1', [userId], function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json({ message: 'Usuário excluído com sucesso' });
        });
    });
};

// Mudar senha (admin define nova senha)
exports.changePassword = async (req, res) => {
    const userId = req.params.userId;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, userId], function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao atualizar senha' });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json({ message: 'Senha alterada com sucesso' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno' });
    }
};

// Adicionar saldo
exports.addBalance = (req, res) => {
    const userId = req.params.userId;
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    db.run('UPDATE usuarios SET saldo = saldo + $1, total_adicionado = total_adicionado + $1 WHERE id = $2', [amount, userId], function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao adicionar saldo' });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        db.run('INSERT INTO transacoes (usuario_id, tipo, valor, descricao, status_pagamento) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'adicao', amount, 'Adição manual por admin', 'COMPLETO'], (err2) => {
                if (err2) console.error('Erro ao registrar transação:', err2);
                res.json({ message: 'Saldo adicionado com sucesso' });
            });
    });
};

// Remover saldo
exports.removeBalance = (req, res) => {
    const userId = req.params.userId;
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    db.get('SELECT saldo FROM usuarios WHERE id = $1', [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Erro no banco' });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        if (user.saldo < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

        db.run('UPDATE usuarios SET saldo = saldo - $1, total_gasto = total_gasto + $1 WHERE id = $2', [amount, userId], function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao remover saldo' });
            db.run('INSERT INTO transacoes (usuario_id, tipo, valor, descricao, status_pagamento) VALUES ($1, $2, $3, $4, $5)',
                [userId, 'compra', amount, 'Remoção manual por admin', 'COMPLETO'], (err2) => {
                    if (err2) console.error('Erro ao registrar transação:', err2);
                    res.json({ message: 'Saldo removido com sucesso' });
                });
        });
    });
};

// Tornar admin
exports.toggleAdmin = (req, res) => {
    const userId = req.params.userId;
    const { is_admin } = req.body; // espera true ou false

    db.run('UPDATE usuarios SET is_admin = $1 WHERE id = $2', [is_admin, userId], function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar admin' });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: is_admin ? 'Usuário agora é admin' : 'Usuário não é mais admin' });
    });
};