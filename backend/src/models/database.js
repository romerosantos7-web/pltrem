const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const usePostgres = process.env.DB_TYPE === 'postgres';

let db;
let pgPool;

if (usePostgres) {
    pgPool = new Pool({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    db = {
        run: (sql, params = [], callback) => {
            pgPool.query(sql, params, (err, res) => {
                if (callback) {
                    if (err) callback(err);
                    else callback(null, { lastID: res?.rows[0]?.id, changes: res?.rowCount });
                }
            });
        },
        get: (sql, params = [], callback) => {
            pgPool.query(sql, params, (err, res) => {
                if (callback) callback(err, res?.rows[0]);
            });
        },
        all: (sql, params = [], callback) => {
            pgPool.query(sql, params, (err, res) => {
                if (callback) callback(err, res?.rows);
            });
        },
        transaction: async (queries) => {
            const client = await pgPool.connect();
            try {
                await client.query('BEGIN');
                const results = [];
                for (const { sql, params } of queries) {
                    const res = await client.query(sql, params);
                    results.push(res);
                }
                await client.query('COMMIT');
                return results;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        },
        serialize: (fn) => fn(),
    };

    initPostgres();
} else {
    const dbPath = path.resolve(__dirname, '../../database.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Erro SQLite:', err.message);
        else initSqlite();
    });
}

async function initPostgres() {
    try {
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL,
                discord TEXT,
                saldo DECIMAL(10,2) DEFAULT 0,
                total_adicionado DECIMAL(10,2) DEFAULT 0,
                total_gasto DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                tipo TEXT CHECK(tipo IN ('adicao', 'compra')) NOT NULL,
                valor DECIMAL(10,2) NOT NULL,
                descricao TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const adminUsername = 'admin';
        const adminEmail = 'admin@rbxstore.com';
        const adminPassword = 'Admin@123';

        const result = await pgPool.query('SELECT id FROM usuarios WHERE username = $1', [adminUsername]);
        if (result.rowCount === 0) {
            const hash = await bcrypt.hash(adminPassword, 10);
            await pgPool.query(
                'INSERT INTO usuarios (username, email, senha_hash) VALUES ($1, $2, $3)',
                [adminUsername, adminEmail, hash]
            );
            console.log('Admin criado no PostgreSQL');
        }
    } catch (err) {
        console.error('Erro ao criar tabelas no PostgreSQL:', err);
    }
}

function initSqlite() {
    db.serialize(() => {
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

        const adminUsername = 'admin';
        const adminEmail = 'admin@rbxstore.com';
        const adminPassword = 'Admin@123';

        db.get('SELECT id FROM usuarios WHERE username = ?', [adminUsername], (err, row) => {
            if (!row) {
                bcrypt.hash(adminPassword, 10, (err, hash) => {
                    db.run(
                        'INSERT INTO usuarios (username, email, senha_hash) VALUES (?, ?, ?)',
                        [adminUsername, adminEmail, hash]
                    );
                });
            }
        });
    });
}

module.exports = db;