const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

app.use(cors()); // Permitir requisições do frontend (Netlify)
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'API da RBX Store funcionando!' });
});

module.exports = app;