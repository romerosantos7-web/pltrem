const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
require('dotenv').config();

exports.register = (req, res) => {
    const { username, email, password, discord } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios: username, email, password' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Erro ao criar senha' });

        db.run(
            `INSERT INTO usuarios (username, email, senha_hash, discord) VALUES ($1, $2, $3, $4)`,
            [username, email, hash, discord || null],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE') || err.constraint === 'usuarios_username_key') {
                        return res.status(409).json({ error: 'Usuário ou e-mail já existe' });
                    }
                    return res.status(500).json({ error: 'Erro no banco de dados' });
                }
                res.status(201).json({ message: 'Usuário criado com sucesso', id: this.lastID });
            }
        );
    });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM usuarios WHERE username = $1', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Erro no banco' });
        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

        bcrypt.compare(password, user.senha_hash, (err, match) => {
            if (err) return res.status(500).json({ error: 'Erro ao verificar senha' });
            if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    saldo: user.saldo
                }
            });
        });
    });
};