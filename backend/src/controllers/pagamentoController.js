const db = require('../models/database');
const axios = require('axios');

const CI = process.env.MISTICPAY_CI;
const CS = process.env.MISTICPAY_CS;
const API_BASE = 'https://api.misticpay.com/api';

exports.criarPix = async (req, res) => {
    try {
        const { valor } = req.body;
        const usuarioId = req.userId;

        if (!valor || valor < 5) {
            return res.status(400).json({ error: 'Valor mínimo de R$ 5,00' });
        }

        // Busca dados do usuário
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT username, email FROM usuarios WHERE id = $1', [usuarioId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const nossoId = `rbx_${Date.now()}_${usuarioId}`;

        const payload = {
            amount: valor,
            payerName: user.username,
            payerDocument: '00000000000',
            transactionId: nossoId,
            description: `Adição de saldo - ${user.username}`,
            projectWebhook: `${process.env.BASE_URL}/api/webhooks/misticpay`
        };

        const response = await axios.post(`${API_BASE}/transactions/create`, payload, {
            headers: {
                'ci': CI,
                'cs': CS,
                'Content-Type': 'application/json'
            }
        });

        const dados = response.data.data;

        // Salva transação pendente (tipo 'adicao' e status 'PENDENTE')
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO transacoes (usuario_id, tipo, valor, descricao, misticpay_id, status_pagamento)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [usuarioId, 'adicao', valor, 'Aguardando pagamento PIX', dados.transactionId, 'PENDENTE'],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            message: 'QR Code gerado com sucesso',
            qrCodeBase64: dados.qrCodeBase64,
            copyPaste: dados.copyPaste,
            transactionId: dados.transactionId,
            valor: valor
        });

    } catch (error) {
        console.error('Erro ao gerar PIX:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
};

exports.webhookMisticpay = async (req, res) => {
    try {
        const notificacao = req.body;
        console.log('Webhook recebido:', notificacao);

        if (notificacao.transactionType !== 'DEPOSITO') {
            return res.status(200).json({ message: 'Tipo ignorado' });
        }

        const { transactionId, status, value } = notificacao; // value está em centavos

        // Busca transação pelo misticpay_id
        const transacao = await new Promise((resolve, reject) => {
            db.get('SELECT id, usuario_id FROM transacoes WHERE misticpay_id = $1', [transactionId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!transacao) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        if (status === 'COMPLETO') {
            const valorReais = value / 100; // converte centavos para reais

            // Atualiza status da transação
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE transacoes SET status_pagamento = 'COMPLETO', descricao = 'Adição de saldo via PIX' WHERE id = $1`,
                    [transacao.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Adiciona saldo ao usuário
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE usuarios SET saldo = saldo + $1, total_adicionado = total_adicionado + $1 WHERE id = $2`,
                    [valorReais, transacao.usuario_id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            console.log(`Saldo atualizado para usuário ${transacao.usuario_id}, valor R$ ${valorReais}`);
        } else if (['FALHA', 'CANCELADO'].includes(status)) {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE transacoes SET status_pagamento = $1 WHERE id = $2`,
                    [status, transacao.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
};