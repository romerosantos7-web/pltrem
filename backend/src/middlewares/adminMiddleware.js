const db = require('../models/database');

module.exports = (req, res, next) => {
    if (!req.userId) {
        console.log('AdminMiddleware: userId não encontrado');
        return res.status(401).json({ error: 'Não autenticado' });
    }

    db.get('SELECT is_admin FROM usuarios WHERE id = $1', [req.userId], (err, user) => {
        if (err) {
            console.log('AdminMiddleware: erro no banco', err);
            return res.status(500).json({ error: 'Erro no banco' });
        }
        if (!user) {
            console.log('AdminMiddleware: usuário não encontrado');
            return res.status(403).json({ error: 'Acesso negado' });
        }
        if (!user.is_admin) {
            console.log('AdminMiddleware: usuário não é admin');
            return res.status(403).json({ error: 'Acesso negado' });
        }
        console.log('AdminMiddleware: acesso permitido para admin', user);
        next();
    });
};