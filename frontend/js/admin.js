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
    if (!userData || !userData.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const container = document.getElementById('statsContainer');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-coins"></i></div>
                <div class="stat-label">Saldo MisticPay</div>
                <div class="stat-value">R$ ${Number(data.misticpay_balance || 0).toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
                <div class="stat-label">Total Adicionado</div>
                <div class="stat-value">R$ ${Number(data.total_adicionado || 0).toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
                <div class="stat-label">Total Gasto</div>
                <div class="stat-value">R$ ${Number(data.total_gasto || 0).toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-exchange-alt"></i></div>
                <div class="stat-label">Total Transações</div>
                <div class="stat-value">${data.total_transacoes || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-users"></i></div>
                <div class="stat-label">Total Usuários</div>
                <div class="stat-value">${data.total_usuarios || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="stat-label">Total Compras</div>
                <div class="stat-value">${data.total_compras || 0}</div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Usuário</th><th>Email</th><th>Discord</th><th>Saldo</th><th>Adic.</th><th>Gasto</th><th>Admin</th><th>Ações</th></tr></thead><tbody>';
        data.users.forEach(user => {
            html += `<tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.discord || '-'}</td>
                <td>R$ ${Number(user.saldo).toFixed(2)}</td>
                <td>R$ ${Number(user.total_adicionado).toFixed(2)}</td>
                <td>R$ ${Number(user.total_gasto).toFixed(2)}</td>
                <td>${user.is_admin ? '<span style="color:#ec4899;">Sim</span>' : 'Não'}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn-icon" onclick="toggleActions(${user.id})"><i class="fas fa-cog"></i></button>
                        <div class="actions-menu" id="menu-${user.id}">
                            <a href="#" onclick="excluirUsuario(${user.id}, '${user.username}')"><i class="fas fa-trash-alt"></i> Excluir</a>
                            <a href="#" onclick="mudarSenha(${user.id}, '${user.username}')"><i class="fas fa-key"></i> Mudar senha</a>
                            <a href="#" onclick="adicionarSaldo(${user.id}, '${user.username}')"><i class="fas fa-plus-circle"></i> Adicionar saldo</a>
                            <a href="#" onclick="removerSaldo(${user.id}, '${user.username}')"><i class="fas fa-minus-circle"></i> Remover saldo</a>
                            <a href="#" onclick="tornarAdmin(${user.id}, '${user.username}', ${user.is_admin})"><i class="fas fa-user-cog"></i> ${user.is_admin ? 'Remover admin' : 'Tornar admin'}</a>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

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
        container.innerHTML = '<p style="text-align: center; color: #f56565;">Erro ao carregar usuários</p>';
    }
}

// Funções para gerenciar o menu de ações
window.toggleActions = function (userId) {
    const menu = document.getElementById(`menu-${userId}`);
    if (menu) {
        menu.classList.toggle('show');
        // Fechar outros menus abertos
        document.querySelectorAll('.actions-menu').forEach(m => {
            if (m.id !== `menu-${userId}`) m.classList.remove('show');
        });
    }
};

// Fechar menus ao clicar fora
document.addEventListener('click', function (event) {
    if (!event.target.closest('.user-actions')) {
        document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('show'));
    }
});

// Placeholders para as ações (você implementará a lógica depois)
window.excluirUsuario = function (id, username) {
    alert(`Excluir usuário ${username} (ID ${id}) - implementar`);
};

window.mudarSenha = function (id, username) {
    const novaSenha = prompt(`Nova senha para ${username}:`);
    if (novaSenha) alert(`Senha alterada para ${username} - implementar`);
};

window.adicionarSaldo = function (id, username) {
    const valor = prompt(`Valor a adicionar para ${username}:`);
    if (valor) alert(`Adicionar R$ ${valor} para ${username} - implementar`);
};

window.removerSaldo = function (id, username) {
    const valor = prompt(`Valor a remover de ${username}:`);
    if (valor) alert(`Remover R$ ${valor} de ${username} - implementar`);
};

window.tornarAdmin = function (id, username, isAdmin) {
    const acao = isAdmin ? 'remover admin' : 'tornar admin';
    if (confirm(`Deseja ${acao} ${username}?`)) {
        alert(`${acao} para ${username} - implementar`);
    }
};

// Ranking
async function carregarRanking() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const container = document.getElementById('rankingContainer');
    container.innerHTML = '<p style="text-align: center;">Carregando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/ranking?limit=10`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let html = '<table class="admin-table"><thead><tr><th>#</th><th>Usuário</th><th>Total Adicionado</th><th>Transações</th></tr></thead><tbody>';
        data.forEach((user, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td><span style="color:#48bb78; font-weight:600;">R$ ${Number(user.total_adicionado).toFixed(2)}</span></td>
                <td>${user.total_transacoes}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: #f56565;">Erro ao carregar ranking</p>';
    }
}

// Saque
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
            feedback.innerHTML = '<div class="feedback-success"><i class="fas fa-check-circle"></i> Saque realizado com sucesso!</div>';
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('pixKey').value = '';
            carregarDashboard();
        } else {
            feedback.innerHTML = `<div class="feedback-error"><i class="fas fa-exclamation-circle"></i> ${data.error || 'Erro ao sacar'}</div>`;
        }
    } catch (error) {
        feedback.innerHTML = '<div class="feedback-error">Erro de conexão</div>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bolt"></i> Realizar Saque';
    }
}