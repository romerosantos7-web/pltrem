const db = require('../models/database');
const axios = require('axios');

const CI = process.env.MISTICPAY_CI;
const CS = process.env.MISTICPAY_CS;
const API_BASE = 'https://api.misticpay.com/api';

// Estatísticas gerais da plataforma
exports.getDashboardStats = async (req, res) => {
    try {
        // Estatísticas do banco local
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

        // Buscar saldo na MisticPay
        let misticpayBalance = 0;
        try {
            const response = await axios.get(`${API_BASE}/users/balance`, {
                headers: {
                    'ci': CI,
                    'cs': CS
                }
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
};

// Ranking de usuários que mais adicionaram saldo
exports.getRankingAdicoes = (req, res) => {
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
};

// Realizar saque via admin
exports.adminWithdraw = async (req, res) => {
    try {
        const { amount, pixKey, pixKeyType, description } = req.body;

        if (!amount || amount < 5) {
            return res.status(400).json({ error: 'Valor mínimo de R$ 5,00' });
        }
        if (!pixKey || !pixKeyType) {
            return res.status(400).json({ error: 'Chave PIX e tipo são obrigatórios' });
        }

        // Validar se tem saldo suficiente na MisticPay
        const balanceResponse = await axios.get(`${API_BASE}/users/balance`, {
            headers: { 'ci': CI, 'cs': CS }
        });
        const availableBalance = balanceResponse.data.data?.balance || 0;

        if (amount > availableBalance) {
            return res.status(400).json({ error: 'Saldo insuficiente na conta MisticPay' });
        }

        // Realizar o saque
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

        // Registrar o saque em uma tabela futura (opcional)
        // await db.run('INSERT INTO saques (valor, pix_key, status) VALUES ($1, $2, $3)', [amount, pixKey, 'processado']);

        res.json({
            message: 'Saque realizado com sucesso',
            data: withdrawResponse.data
        });

    } catch (error) {
        console.error('Erro ao realizar saque:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao processar saque' });
    }
};