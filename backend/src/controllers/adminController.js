const db = require('../models/database');

// Listar usuários com paginação
exports.listUsers = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all(
        'SELECT id, username, email, discord, saldo, total_adicionado, total_gasto, is_admin, created_at FROM usuarios ORDER BY id LIMIT $1 OFFSET $2',
        [limit, offset],
        (err, users) => {
            if (err) {
                console.error('Erro ao listar usuários:', err);
                return res.status(500).json({ error: 'Erro no banco de dados' });
            }

            db.get('SELECT COUNT(*) as total FROM usuarios', [], (err2, count) => {
                if (err2) {
                    console.error('Erro ao contar usuários:', err2);
                    return res.status(500).json({ error: 'Erro no banco de dados' });
                }

                res.json({
                    users,
                    total: count.total,
                    page,
                    totalPages: Math.ceil(count.total / limit)
                });
            });
        }
    );
};

// Ver transações de um usuário específico
exports.getUserTransactions = (req, res) => {
    const userId = req.params.userId;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuário inválido' });
    }

    db.all(
        'SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY created_at DESC',
        [userId],
        (err, transactions) => {
            if (err) {
                console.error('Erro ao buscar transações:', err);
                return res.status(500).json({ error: 'Erro no banco de dados' });
            }

            res.json(transactions);
        }
    );
};