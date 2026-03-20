const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const adminRoutes = require('./routes/adminRoutes'); // rotas antigas (listar usuários)
const adminDashboardRoutes = require('./routes/adminDashboardRoutes'); // <-- NOVA LINHA
const adminCategoriasRoutes = require('./routes/adminCategoriasRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminCategoriaRoutes = require('./routes/adminCategoriaRoutes');
const adminProdutoRoutes = require('./routes/adminProdutoRoutes');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/admin', adminRoutes); // /api/admin/users, /api/admin/users/:userId/transactions
app.use('/api/admin', adminDashboardRoutes); // /api/admin/stats, /api/admin/ranking, /api/admin/withdraw
app.use('/api/admin', adminCategoriasRoutes); // já tem auth/admin middleware
app.use('/api/categorias', categoriasRoutes); // público
app.use('/api/public', publicRoutes); // rotas abertas (sem auth)
app.use('/api/admin/categorias', adminCategoriaRoutes);
app.use('/api/admin/produtos', adminProdutoRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API da RBX Store funcionando!' });
});

module.exports = app;