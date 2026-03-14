const db = require('../models/database');

module.exports = (req, res, next) => {
    if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });

    db.get('SELECT is_admin FROM usuarios WHERE id = $1', [req.userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Erro no banco' });
        if (!user || !user.is_admin) return res.status(403).json({ error: 'Acesso negado' });
        next();
    });
};