const API_BASE_URL = 'https://pltrem.onrender.com/api';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function () {
    // Verificar se é admin antes de carregar a página
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

    carregarUsuarios(currentPage);

    document.getElementById('refreshUsers').addEventListener('click', () => carregarUsuarios(currentPage));

    // Modal
    const modal = document.getElementById('transactionModal');
    document.getElementById('closeModal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
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

async function carregarUsuarios(page) {
    const userData = getUserData();
    if (!userData) return;

    document.getElementById('loading').style.display = 'block';
    document.getElementById('usersContainer').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            renderUsers(data.users, data.page, data.totalPages);
        } else {
            alert('Erro ao carregar usuários: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('usersContainer').style.display = 'block';
    }
}

function renderUsers(users, currentPage, totalPages) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.discord || '-'}</td>
            <td>R$ ${Number(user.saldo).toFixed(2)}</td>
            <td>${user.is_admin ? 'Sim' : 'Não'}</td>
            <td><button class="btn-view" data-id="${user.id}" data-username="${user.username}">Ver transações</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Paginação
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => carregarUsuarios(i));
        pagination.appendChild(btn);
    }

    // Eventos dos botões "Ver transações"
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            const username = btn.getAttribute('data-username');
            carregarTransacoes(userId, username);
        });
    });
}

async function carregarTransacoes(userId, username) {
    const userData = getUserData();
    if (!userData) return;

    const modal = document.getElementById('transactionModal');
    document.getElementById('modalUserName').textContent = `Transações de ${username}`;
    document.getElementById('transactionList').innerHTML = 'Carregando...';
    modal.classList.add('active');

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/transactions`, {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        const transacoes = await response.json();
        if (response.ok) {
            if (transacoes.length === 0) {
                document.getElementById('transactionList').innerHTML = '<p>Nenhuma transação encontrada.</p>';
            } else {
                let html = '';
                transacoes.forEach(t => {
                    html += `
                        <div class="transaction-item">
                            <span>${new Date(t.created_at).toLocaleDateString()} - ${t.tipo} - ${t.descricao || ''}</span>
                            <span>R$ ${Number(t.valor).toFixed(2)}</span>
                        </div>
                    `;
                });
                document.getElementById('transactionList').innerHTML = html;
            }
        } else {
            document.getElementById('transactionList').innerHTML = '<p>Erro ao carregar transações.</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('transactionList').innerHTML = '<p>Erro de conexão.</p>';
    }
}