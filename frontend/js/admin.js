const API_BASE_URL = 'https://pltrem.onrender.com/api';
let currentUserPage = 1;
let currentUserId = null; // para o modal

document.addEventListener('DOMContentLoaded', function () {
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    if (!userData.user.is_admin) {
        alert('Acesso negado. Você não é administrador.');
        window.location.href = 'index.html';
        return;
    }

    // Tabs
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'dashboard') carregarDashboard();
            if (tabName === 'users') carregarUsuarios(currentUserPage);
            if (tabName === 'ranking') carregarRanking();
        });
    });

    carregarDashboard();
    carregarUsuarios(currentUserPage);
    carregarRanking();

    // Seletor customizado de tipo PIX
    document.querySelectorAll('.pix-type-option').forEach(opt => {
        opt.addEventListener('click', function () {
            document.querySelectorAll('.pix-type-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('pixKeyType').value = this.dataset.value;
        });
    });

    document.getElementById('btnWithdraw').addEventListener('click', realizarSaque);

    // Modal
    const modal = document.getElementById('userActionModal');
    const closeModal = document.getElementById('closeModal');
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
});

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

// ========== DASHBOARD ==========
async function carregarDashboard() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        document.getElementById('misticpayBalance').textContent = `R$ ${Number(data.misticpay_balance || 0).toFixed(2)}`;
        document.getElementById('totalAdicionado').textContent = `R$ ${Number(data.total_adicionado || 0).toFixed(2)}`;
        document.getElementById('totalGasto').textContent = `R$ ${Number(data.total_gasto || 0).toFixed(2)}`;
        document.getElementById('totalTransacoes').textContent = data.total_transacoes || 0;
        document.getElementById('totalUsuarios').textContent = data.total_usuarios || 0;
        document.getElementById('totalCompras').textContent = data.total_compras || 0;
    } catch (error) {
        console.error('Erro dashboard:', error);
        document.querySelectorAll('#statsContainer .stat-value').forEach(el => el.textContent = 'Erro');
    }
}

// ========== USUÁRIOS ==========
async function carregarUsuarios(page) {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let html = '';
        data.users.forEach(user => {
            html += `<tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.discord || '-'}</td>
                <td>R$ ${Number(user.saldo).toFixed(2)}</td>
                <td>R$ ${Number(user.total_adicionado).toFixed(2)}</td>
                <td>R$ ${Number(user.total_gasto).toFixed(2)}</td>
                <td>${user.is_admin ? 'Sim' : 'Não'}</td>
                <td><button class="action-btn" onclick="abrirModalAcoes(${user.id})"><i class="fas fa-cog"></i></button></td>
            </tr>`;
        });
        tbody.innerHTML = html;

        // Paginação
        const pagination = document.getElementById('userPagination');
        pagination.innerHTML = '';
        for (let i = 1; i <= data.totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === page) btn.classList.add('active');
            btn.addEventListener('click', () => carregarUsuarios(i));
            pagination.appendChild(btn);
        }
    } catch (error) {
        console.error('Erro usuários:', error);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#f56565;">Erro ao carregar</td></tr>';
    }
}

// ========== MODAL DE AÇÕES ==========
function abrirModalAcoes(userId) {
    currentUserId = userId;
    const modal = document.getElementById('userActionModal');
    const container = document.getElementById('modalActionContainer');
    const acoes = [
        { icone: 'fa-trash', texto: 'Excluir usuário', acao: 'excluir' },
        { icone: 'fa-key', texto: 'Mudar senha', acao: 'senha' },
        { icone: 'fa-plus-circle', texto: 'Adicionar saldo', acao: 'addSaldo' },
        { icone: 'fa-minus-circle', texto: 'Remover saldo', acao: 'removeSaldo' },
        { icone: 'fa-crown', texto: 'Tornar admin', acao: 'tornarAdmin' }
    ];
    container.innerHTML = acoes.map(a => `
        <div class="modal-action" onclick="executarAcao('${a.acao}', ${userId})">
            <i class="fas ${a.icone}"></i>
            <span>${a.texto}</span>
        </div>
    `).join('');
    modal.classList.add('active');
}

window.executarAcao = (acao, userId) => {
    document.getElementById('userActionModal').classList.remove('active');
    const acoes = {
        excluir: 'Excluir usuário',
        senha: 'Mudar senha',
        addSaldo: 'Adicionar saldo',
        removeSaldo: 'Remover saldo',
        tornarAdmin: 'Tornar admin'
    };
    alert(`[Simulação] ${acoes[acao]} do usuário ID ${userId}. Implemente a chamada à API.`);
};

// ========== RANKING ==========
async function carregarRanking() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const tbody = document.getElementById('rankingTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/ranking?limit=10`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let html = '';
        data.forEach((user, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td>R$ ${Number(user.total_adicionado).toFixed(2)}</td>
                <td>${user.total_transacoes}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Erro ranking:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#f56565;">Erro ao carregar</td></tr>';
    }
}

// ========== SAQUE ==========
async function realizarSaque() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const pixKeyType = document.getElementById('pixKeyType').value;
    const pixKey = document.getElementById('pixKey').value.trim();
    const description = document.getElementById('withdrawDescription').value.trim() || 'Saque admin';
    const feedback = document.getElementById('withdrawFeedback');

    if (!amount || amount < 5) {
        feedback.innerHTML = '<div class="feedback-error">Valor mínimo R$ 5,00</div>';
        return;
    }
    if (!pixKey) {
        feedback.innerHTML = '<div class="feedback-error">Chave PIX obrigatória</div>';
        return;
    }

    const btn = document.getElementById('btnWithdraw');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    feedback.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify({ amount, pixKey, pixKeyType, description })
        });
        const data = await response.json();
        if (response.ok) {
            feedback.innerHTML = '<div class="feedback-success">Saque realizado com sucesso!</div>';
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('pixKey').value = '';
            carregarDashboard();
        } else {
            feedback.innerHTML = `<div class="feedback-error">${data.error || 'Erro ao sacar'}</div>`;
        }
    } catch (error) {
        console.error('Erro saque:', error);
        feedback.innerHTML = '<div class="feedback-error">Erro de conexão</div>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Realizar Saque';
    }
}