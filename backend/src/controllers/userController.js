const db = require('../models/database');

exports.getProfile = (req, res) => {
    db.get(
        'SELECT id, username, email, discord, saldo, total_adicionado, total_gasto, created_at FROM usuarios WHERE id = ?',
        [req.userId],
        (err, user) => {
            if (err) return res.status(500).json({ error: 'Erro no banco' });
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json(user);
        }
    );
};

exports.getHistory = (req, res) => {
    db.all(
        'SELECT * FROM transacoes WHERE usuario_id = ? ORDER BY created_at DESC',
        [req.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Erro no banco' });
            res.json(rows);
        }
    );
};