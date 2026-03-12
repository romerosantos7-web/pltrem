const db = require('../models/database');

exports.addSaldo = (req, res) => {
    const { valor } = req.body;
    const userId = req.userId;

    if (!valor || valor <= 0) {
        return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            'UPDATE usuarios SET saldo = saldo + ?, total_adicionado = total_adicionado + ? WHERE id = ?',
            [valor, valor, userId],
            function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Erro ao atualizar saldo' });
                }

                db.run(
                    'INSERT INTO transacoes (usuario_id, tipo, valor, descricao) VALUES (?, ?, ?, ?)',
                    [userId, 'adicao', valor, 'Adição de saldo via PIX'],
                    function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Erro ao registrar transação' });
                        }

                        db.run('COMMIT', (err) => {
                            if (err) return res.status(500).json({ error: 'Erro ao finalizar' });
                            res.json({ message: 'Saldo adicionado com sucesso' });
                        });
                    }
                );
            }
        );
    });
};

// (Futuramente) comprar produto