const API_BASE_URL = 'https://pltrem.onrender.com/api';
let currentUserPage = 1;
let currentRankingLimit = 10;

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

    document.getElementById('btnWithdraw').addEventListener('click', realizarSaque);
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

async function carregarDashboard() {
    const userData = getUserData();
    if (!userData || !userData.token) {
        console.error('Dashboard: usuário não autenticado');
        return;
    }

    try {
        console.log('Fazendo requisição para /admin/stats com token:', userData.token.substring(0, 10) + '...');
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });

        console.log('Dashboard - Status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('Dashboard - Content-Type:', contentType);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Dashboard - Erro resposta:', errorText.substring(0, 200));
            throw new Error(`HTTP ${response.status}`);
        }

        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Dashboard - Resposta não é JSON:', text.substring(0, 200));
            throw new Error('Resposta inválida do servidor');
        }

        const data = await response.json();
        console.log('Dashboard - Dados recebidos:', data);

        document.getElementById('misticpayBalance').textContent =
            `R$ ${Number(data.misticpay_balance || 0).toFixed(2)}`;
        document.getElementById('totalAdicionado').textContent =
            `R$ ${Number(data.total_adicionado || 0).toFixed(2)}`;
        document.getElementById('totalGasto').textContent =
            `R$ ${Number(data.total_gasto || 0).toFixed(2)}`;
        document.getElementById('totalTransacoes').textContent = data.total_transacoes || 0;
        document.getElementById('totalUsuarios').textContent = data.total_usuarios || 0;
        document.getElementById('totalCompras').textContent = data.total_compras || 0;

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        document.querySelectorAll('#statsContainer .stat-value').forEach(el => {
            el.textContent = 'Erro';
        });
    }
}

async function carregarUsuarios(page) {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const container = document.getElementById('usersContainer');
    container.innerHTML = '<p style="text-align: center;">Carregando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Usuário</th><th>Email</th><th>Discord</th><th>Saldo</th><th>Total Adic.</th><th>Total Gasto</th><th>Admin</th></tr></thead><tbody>';
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
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        const pagination = document.getElementById('userPagination');
        pagination.innerHTML = '';
        for (let i = 1; i <= data.totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 12px; border-radius: 20px; cursor: pointer;';
            if (i === page) btn.style.background = 'var(--secondary)';
            btn.addEventListener('click', () => carregarUsuarios(i));
            pagination.appendChild(btn);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        container.innerHTML = '<p style="text-align: center; color: #f56565;">Erro ao carregar usuários</p>';
    }
}

async function carregarRanking() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const container = document.getElementById('rankingContainer');
    container.innerHTML = '<p style="text-align: center;">Carregando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/ranking?limit=10`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        let html = '<table class="admin-table"><thead><tr><th>#</th><th>Usuário</th><th>Total Adicionado</th><th>Transações</th></tr></thead><tbody>';
        data.forEach((user, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td>R$ ${Number(user.total_adicionado).toFixed(2)}</td>
                <td>${user.total_transacoes}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        container.innerHTML = '<p style="text-align: center; color: #f56565;">Erro ao carregar ranking</p>';
    }
}

async function realizarSaque() {
    const userData = getUserData();
    if (!userData || !userData.token) {
        alert('Usuário não autenticado');
        return;
    }

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
    btn.textContent = 'Processando...';
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
        console.error('Erro no saque:', error);
        feedback.innerHTML = '<div class="feedback-error">Erro de conexão</div>';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Realizar Saque';
    }
}