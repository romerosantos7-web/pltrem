const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, '../../database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        console.log('Conectado ao SQLite.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Tabela de usuários
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL,
                discord TEXT,
                saldo REAL DEFAULT 0,
                total_adicionado REAL DEFAULT 0,
                total_gasto REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de transações
        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                tipo TEXT CHECK(tipo IN ('adicao', 'compra')) NOT NULL,
                valor REAL NOT NULL,
                descricao TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
            )
        `);

        // Criar admin inicial (ID 1) se não existir
        const adminUsername = 'admin';
        const adminEmail = 'admin@rbxstore.com';
        const adminPassword = 'Admin@123'; // Você pode alterar e hashear

        db.get('SELECT id FROM usuarios WHERE username = ?', [adminUsername], (err, row) => {
            if (err) throw err;
            if (!row) {
                bcrypt.hash(adminPassword, 10, (err, hash) => {
                    if (err) throw err;
                    db.run(
                        'INSERT INTO usuarios (username, email, senha_hash) VALUES (?, ?, ?)',
                        [adminUsername, adminEmail, hash],
                        function (err) {
                            if (err) console.error('Erro ao criar admin:', err.message);
                            else console.log('Admin criado com ID:', this.lastID);
                        }
                    );
                });
            }
        });
    });
}

module.exports = db;