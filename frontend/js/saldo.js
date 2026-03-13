// saldo.js - Versão completa com integração PIX

const API_BASE_URL = 'https://pltrem.onrender.com/api'; // Ajuste se necessário

document.addEventListener('DOMContentLoaded', function () {
    // Elementos do slider e display
    const slider = document.getElementById('saldoSlider');
    const valorDisplay = document.getElementById('valorDisplay');
    const valorNumerico = document.getElementById('valorNumerico');
    const valorPredefinidos = document.querySelectorAll('.valor-predefinido');
    const btnAdicionar = document.getElementById('btnAdicionarSaldo');
    const saldoAtualSpan = document.getElementById('saldoAtual'); // No header
    const qrContainer = document.getElementById('qrContainer');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const pixCode = document.getElementById('pixCode');
    const copiarPix = document.getElementById('copiarPix');
    const fecharQr = document.getElementById('fecharQr');

    // Atualiza o display do slider
    function atualizarDisplay(valor) {
        valorDisplay.textContent = `R$ ${valor.toFixed(2)}`;
        valorNumerico.value = valor.toFixed(2);
    }

    // Evento do slider
    slider.addEventListener('input', function () {
        atualizarDisplay(parseFloat(this.value));
    });

    // Botões de valores pré-definidos
    valorPredefinidos.forEach(btn => {
        btn.addEventListener('click', function () {
            const valor = parseFloat(this.getAttribute('data-valor'));
            slider.value = valor;
            atualizarDisplay(valor);
        });
    });

    // Campo numérico (sincroniza com slider)
    valorNumerico.addEventListener('input', function () {
        let valor = parseFloat(this.value) || 0;
        if (valor < 20) valor = 20;
        if (valor > 500) valor = 500;
        slider.value = valor;
        atualizarDisplay(valor);
    });

    // Função para atualizar saldo no header (vinda do login)
    async function atualizarSaldoHeader() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const user = await response.json();
                saldoAtualSpan.textContent = user.saldo.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
        }
    }

    // Chama a função ao carregar a página
    atualizarSaldoHeader();

    // Botão Adicionar Saldo
    btnAdicionar.addEventListener('click', async function () {
        const valor = parseFloat(slider.value);
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Você precisa estar logado.');
            window.location.href = 'login.html';
            return;
        }

        if (valor < 20) {
            alert('Valor mínimo é R$ 5,00');
            return;
        }

        // Desabilita botão para evitar duplo clique
        btnAdicionar.disabled = true;
        btnAdicionar.textContent = 'Gerando PIX...';

        try {
            const response = await fetch(`${API_BASE_URL}/pagamentos/criar-pix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ valor })
            });

            const data = await response.json();

            if (response.ok) {
                // Exibe o QR Code
                qrCodeImage.src = data.qrCodeBase64;
                pixCode.textContent = data.copyPaste;
                qrContainer.style.display = 'block';

                // Inicia verificação periódica de saldo (polling)
                verificarSaldoAteConfirmar(valor);
            } else {
                alert(data.error || 'Erro ao gerar PIX');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro de conexão com o servidor');
        } finally {
            btnAdicionar.disabled = false;
            btnAdicionar.textContent = 'Adicionar Saldo via PIX';
        }
    });

    // Polling para verificar se o saldo foi atualizado (simplificado)
    function verificarSaldoAteConfirmar(valorEsperado) {
        let tentativas = 0;
        const intervalo = setInterval(async () => {
            tentativas++;
            if (tentativas > 60) { // 5 minutos (60 * 5s)
                clearInterval(intervalo);
                alert('O pagamento ainda não foi confirmado. Verifique se você pagou o QR Code.');
                return;
            }

            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${API_BASE_URL}/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const user = await response.json();
                    saldoAtualSpan.textContent = user.saldo.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    });
                    // Se o saldo aumentou no valor esperado (ou mais), para o polling
                    if (user.saldo >= valorEsperado) { // simplificação
                        clearInterval(intervalo);
                        // Opcional: fechar o QR
                        // qrContainer.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Erro no polling:', error);
            }
        }, 5000); // a cada 5 segundos
    }

    // Copiar código PIX
    copiarPix.addEventListener('click', function () {
        navigator.clipboard.writeText(pixCode.textContent).then(() => {
            alert('Código PIX copiado!');
        });
    });

    // Fechar QR Code
    fecharQr.addEventListener('click', function () {
        qrContainer.style.display = 'none';
    });
});