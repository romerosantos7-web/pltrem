const db = require('../models/database');

exports.addSaldo = async (req, res) => {
    const { valor } = req.body;
    const userId = req.userId;

    if (!valor || valor <= 0) {
        return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    try {
        await db.transaction([
            {
                sql: 'UPDATE usuarios SET saldo = saldo + $1, total_adicionado = total_adicionado + $1 WHERE id = $2',
                params: [valor, userId]
            },
            {
                sql: 'INSERT INTO transacoes (usuario_id, tipo, valor, descricao) VALUES ($1, $2, $3, $4)',
                params: [userId, 'adicao', valor, 'Adição de saldo via PIX']
            }
        ]);

        res.json({ message: 'Saldo adicionado com sucesso' });
    } catch (err) {
        console.error('Erro na transação:', err);
        res.status(500).json({ error: 'Erro ao adicionar saldo' });
    }
};