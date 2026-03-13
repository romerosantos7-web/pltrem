const db = require('../models/database');
const axios = require('axios'); // Instale com npm install axios

// Credenciais da MisticPay (armazenadas em variáveis de ambiente)
const CI = process.env.MISTICPAY_CI;
const CS = process.env.MISTICPAY_CS;
const API_BASE = 'https://api.misticpay.com/api';

/**
 * Gera um QR Code PIX para adicionar saldo
 */
exports.criarPix = async (req, res) => {
    try {
        const { valor } = req.body;
        const usuarioId = req.userId;

        if (!valor || valor < 5) {
            return res.status(400).json({ error: 'Valor mínimo de R$ 5,00' });
        }

        // Busca dados do usuário (para nome e documento)
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT username, email FROM usuarios WHERE id = $1', [usuarioId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Gerar um ID único para esta transação (relacionado ao nosso sistema)
        const nossoId = `rbx_${Date.now()}_${usuarioId}`;

        // Corpo da requisição para MisticPay
        const payload = {
            amount: valor,
            payerName: user.username,
            payerDocument: '00000000000', // Placeholder - idealmente teríamos CPF do usuário
            transactionId: nossoId,
            description: `Adição de saldo - Usuário ${user.username}`,
            projectWebhook: `${process.env.BASE_URL}/api/webhooks/misticpay` // URL do webhook
        };

        // Chamada à API MisticPay
        const response = await axios.post(`${API_BASE}/transactions/create`, payload, {
            headers: {
                'ci': CI,
                'cs': CS,
                'Content-Type': 'application/json'
            }
        });

        const dados = response.data.data;

        // Salva a transação pendente no banco
        const transacaoId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO transacoes (usuario_id, tipo, valor, descricao, misticpay_id, status_pagamento)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [usuarioId, 'adicao_pendente', valor, 'Aguardando pagamento PIX', dados.transactionId, 'PENDENTE'],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Retorna os dados do PIX para o frontend
        res.json({
            message: 'QR Code gerado com sucesso',
            qrCodeBase64: dados.qrCodeBase64,
            copyPaste: dados.copyPaste,
            transactionId: dados.transactionId,
            valor: valor
        });

    } catch (error) {
        console.error('Erro ao gerar PIX:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao processar solicitação de pagamento' });
    }
};

/**
 * Webhook para receber notificações da MisticPay
 */
exports.webhookMisticpay = async (req, res) => {
    try {
        // A MisticPay envia um POST com os dados da transação
        const notificacao = req.body;

        console.log('Webhook recebido:', notificacao);

        // Verificar se é uma transação de depósito
        if (notificacao.transactionType !== 'DEPOSITO') {
            return res.status(200).json({ message: 'Tipo não processado' });
        }

        const { transactionId, status, value } = notificacao;

        // Localizar nossa transação pelo misticpay_id
        const transacao = await new Promise((resolve, reject) => {
            db.get('SELECT id, usuario_id FROM transacoes WHERE misticpay_id = $1', [transactionId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!transacao) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        // Se o status for COMPLETO, atualizar saldo do usuário
        if (status === 'COMPLETO') {
            // Atualiza transação para concluída
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE transacoes SET tipo = 'adicao', status_pagamento = 'COMPLETO', descricao = 'Adição de saldo via PIX' WHERE id = $1`,
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
                    [value, transacao.usuario_id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            console.log(`Saldo atualizado para usuário ${transacao.usuario_id}, valor R$ ${value}`);
        } else if (status === 'FALHA' || status === 'CANCELADO') {
            // Marca transação como falha
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

        // Sempre retornar 200 para a MisticPay
        res.status(200).json({ message: 'OK' });

    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
};