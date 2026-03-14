// saldo.js - Versão aprimorada com feedback visual
// Agora com filtro de histórico (apenas concluídos), máscara de nome e correção do valor mínimo

const API_BASE_URL = 'https://pltrem.onrender.com/api'; // Ajuste se necessário

document.addEventListener('DOMContentLoaded', function () {
    // Elementos principais
    const slider = document.getElementById('saldoSlider');
    const valorDisplay = document.getElementById('valorDisplay');
    const valorNumerico = document.getElementById('valorNumerico');
    const quickOptions = document.querySelectorAll('.quick-option');
    const btnAdicionar = document.getElementById('btnAdicionarSaldo');
    const feedbackArea = document.getElementById('feedbackArea');
    const qrSection = document.getElementById('qrSection');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const pixCode = document.getElementById('pixCode');
    const copiarPix = document.getElementById('copiarPix');
    const fecharQr = document.getElementById('fecharQr');
    const historicoList = document.getElementById('historicoList');

    // Função para obter dados do usuário do localStorage (salvo no login)
    function getUserData() {
        const stored = localStorage.getItem('rbx_user');
        if (!stored) return null;
        try {
            const data = JSON.parse(stored);
            if (data.expiresAt && Date.now() > data.expiresAt) {
                localStorage.removeItem('rbx_user');
                return null;
            }
            return data;
        } catch {
            return null;
        }
    }

    // Atualiza display do slider
    function atualizarDisplay(valor) {
        if (valorDisplay) {
            valorDisplay.textContent = `R$ ${Number(valor).toFixed(2)}`;
        }
        if (valorNumerico) {
            valorNumerico.value = valor.toFixed(2);
        }
    }

    // Evento do slider
    if (slider) {
        slider.addEventListener('input', function () {
            atualizarDisplay(this.value);
        });
    }

    // Botões de valores pré-definidos
    quickOptions.forEach(btn => {
        btn.addEventListener('click', function () {
            const valor = parseFloat(this.getAttribute('data-valor'));
            if (slider) slider.value = valor;
            atualizarDisplay(valor);
        });
    });

    // Campo numérico personalizado
    if (valorNumerico) {
        valorNumerico.addEventListener('input', function () {
            let valor = parseFloat(this.value) || 0;
            if (valor < 20) valor = 20;
            if (valor > 500) valor = 500;
            if (slider) slider.value = valor;
            atualizarDisplay(valor);
        });
    }

    // Função para exibir mensagens de feedback
    function mostrarFeedback(mensagem, tipo = 'erro') {
        if (!feedbackArea) return;
        const classe = tipo === 'sucesso' ? 'feedback-success' : 'feedback-error';
        feedbackArea.innerHTML = `<div class="feedback-message ${classe}">${mensagem}</div>`;
        setTimeout(() => {
            feedbackArea.innerHTML = '';
        }, 5000);
    }

    // Função para mascarar nome (mostra primeiras 3 letras, resto *)
    function mascararNome(nome) {
        if (!nome) return '';
        if (nome.length <= 3) return nome + '*'.repeat(3);
        return nome.substring(0, 3) + '*'.repeat(nome.length - 3);
    }

    // Função para carregar saldo e histórico
    async function carregarDadosUsuario() {
        const userData = getUserData();
        if (!userData) return;

        const token = userData.token;
        const username = userData.user.username;

        try {
            // Buscar perfil
            const profileRes = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const user = await profileRes.json();
                const saldoFormatado = user.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                const saldoDisplay = document.getElementById('saldoDisplay');
                const saldoAtual = document.getElementById('saldoAtual');
                if (saldoDisplay) saldoDisplay.textContent = saldoFormatado;
                if (saldoAtual) saldoAtual.textContent = saldoFormatado;
            }

            // Buscar histórico
            const historyRes = await fetch(`${API_BASE_URL}/user/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (historyRes.ok) {
                let transacoes = await historyRes.json();
                // Filtra apenas transações com status_pagamento = 'COMPLETO'
                transacoes = transacoes.filter(t => t.status_pagamento === 'COMPLETO');

                if (historicoList) {
                    if (transacoes.length === 0) {
                        historicoList.innerHTML = '<div class="historico-item" style="justify-content: center;">Nenhuma movimentação concluída</div>';
                    } else {
                        const nomeMascarado = mascararNome(username);
                        historicoList.innerHTML = transacoes.slice(0, 5).map(t => {
                            const valorFormatado = t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            const classe = t.tipo === 'adicao' ? 'positivo' : 'negativo';
                            const sinal = t.tipo === 'adicao' ? '+' : '-';
                            // Usa o nome mascarado do usuário na descrição
                            const descricao = t.descricao || (t.tipo === 'adicao' ? 'Adição de saldo' : 'Compra');
                            return `
                                <div class="historico-item">
                                    <div class="historico-desc">
                                        <i class="fas ${t.tipo === 'adicao' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                                        ${nomeMascarado} - ${descricao}
                                    </div>
                                    <div>
                                        <span class="historico-valor ${classe}">${sinal} ${valorFormatado}</span>
                                        <span class="historico-data">${new Date(t.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    carregarDadosUsuario();

    // Adicionar saldo (gerar PIX)
    btnAdicionar.addEventListener('click', async function () {
        const valor = parseFloat(slider ? slider.value : 50);
        const userData = getUserData();

        if (!userData) {
            mostrarFeedback('Você precisa estar logado.', 'erro');
            window.location.href = 'login.html';
            return;
        }

        if (valor < 20) {
            mostrarFeedback('Valor mínimo é R$ 20,00', 'erro');
            return;
        }

        // Desabilitar botão e mostrar loading
        btnAdicionar.disabled = true;
        btnAdicionar.innerHTML = '<span class="loading-spinner"></span> Gerando PIX...';

        try {
            const response = await fetch(`${API_BASE_URL}/pagamentos/criar-pix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`
                },
                body: JSON.stringify({ valor })
            });

            const data = await response.json();

            if (response.ok) {
                // Esconder feedback anterior e mostrar QR
                feedbackArea.innerHTML = '';
                if (qrSection && qrCodeImage && pixCode) {
                    qrCodeImage.src = data.qrCodeBase64;
                    pixCode.textContent = data.copyPaste;
                    qrSection.style.display = 'block';
                }
                mostrarFeedback('QR Code gerado! Escaneie ou copie o código.', 'sucesso');
            } else {
                mostrarFeedback(data.error || 'Erro ao gerar PIX', 'erro');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            mostrarFeedback('Erro de conexão com o servidor', 'erro');
        } finally {
            btnAdicionar.disabled = false;
            btnAdicionar.innerHTML = '<i class="fas fa-qrcode"></i> Gerar PIX para adicionar';
        }
    });

    // Copiar código PIX
    if (copiarPix) {
        copiarPix.addEventListener('click', function () {
            if (pixCode && pixCode.textContent) {
                navigator.clipboard.writeText(pixCode.textContent).then(() => {
                    mostrarFeedback('Código copiado!', 'sucesso');
                }).catch(() => {
                    mostrarFeedback('Erro ao copiar', 'erro');
                });
            }
        });
    }

    // Fechar QR Code
    if (fecharQr) {
        fecharQr.addEventListener('click', function () {
            if (qrSection) qrSection.style.display = 'none';
        });
    }
});