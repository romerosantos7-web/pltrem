// Simulação de saldo (futuramente virá do backend)
let saldoAtual = 50.00; // Valor inicial para teste

// Elementos
const saldoDisplay = document.getElementById('saldoDisplay');
const saldoAtualSpan = document.getElementById('saldoAtual');
const saldoAtualContainer = document.querySelector('.saldo-atual');
const valorExatoInput = document.getElementById('valorExato');
const slider = document.getElementById('saldoSlider');
const valorBtns = document.querySelectorAll('.valor-btn');
const btnAdicionar = document.getElementById('btnAdicionarSaldo');

// Atualiza os displays de saldo
function atualizarSaldoDisplay() {
    const saldoFormatado = saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (saldoDisplay) saldoDisplay.textContent = saldoFormatado;
    if (saldoAtualSpan) saldoAtualSpan.textContent = saldoFormatado;
}

// Sincroniza input e slider
function sincronizarValor(valor) {
    // Garante que o valor está dentro dos limites
    valor = Math.min(500, Math.max(20, valor));
    // Arredonda para múltiplo de 5
    valor = Math.round(valor / 5) * 5;

    if (slider) slider.value = valor;
    if (valorExatoInput) valorExatoInput.value = valor;
}

// Eventos do slider
if (slider) {
    slider.addEventListener('input', function () {
        sincronizarValor(parseInt(this.value));
    });
}

// Eventos do input de valor exato
if (valorExatoInput) {
    valorExatoInput.addEventListener('input', function () {
        let valor = parseFloat(this.value) || 20;
        sincronizarValor(valor);
    });
}

// Botões pré-definidos
valorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const valor = parseFloat(btn.getAttribute('data-valor'));
        sincronizarValor(valor);
    });
});

// Função para animar a atualização do saldo (roleta)
function animarAtualizacaoSaldo(novoSaldo) {
    return new Promise((resolve) => {
        saldoAtualContainer.classList.add('atualizando');

        // Muda o valor no meio da animação
        setTimeout(() => {
            saldoAtual = novoSaldo;
            atualizarSaldoDisplay();
        }, 200); // No meio da animação

        // Remove a classe após a animação
        setTimeout(() => {
            saldoAtualContainer.classList.remove('atualizando');
            resolve();
        }, 800);
    });
}

// Botão adicionar saldo (simula pagamento)
if (btnAdicionar) {
    btnAdicionar.addEventListener('click', async () => {
        const valor = parseInt(slider.value); // Valor já sincronizado

        // Aqui futuramente será gerado QR Code Pix
        alert(`Simulação: Gerando QR Code Pix para R$ ${valor.toFixed(2)}`);

        // Simula confirmação de pagamento após 2 segundos
        setTimeout(async () => {
            const novoSaldo = saldoAtual + valor;
            await animarAtualizacaoSaldo(novoSaldo);
            alert('Saldo atualizado com sucesso! (Simulação)');
        }, 2000);
    });
}

// Inicializar displays
atualizarSaldoDisplay();
sincronizarValor(50); // Valor inicial