const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- ÚNICO arquivo admin
const categoriasRoutes = require('./routes/categoriasRoutes'); // público

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/admin', adminRoutes); // /api/admin/* (stats, users, categorias, produtos, withdraw)
app.use('/api/categorias', categoriasRoutes); // público

app.get('/', (req, res) => {
    res.json({ message: 'API da RBX Store funcionando!' });
});

module.exports = app;