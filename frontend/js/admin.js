const API_BASE_URL = 'https://pltrem.onrender.com/api';
let currentUserPage = 1;
let currentUserId = null;

// ========== LISTA DE ÍCONES DISPONÍVEIS ==========
const iconesDisponiveis = [
    'fa-gamepad', 'fa-dragon', 'fa-hat-wizard', 'fa-robot', 'fa-skull', 'fa-crown',
    'fa-fish', 'fa-dog', 'fa-cat', 'fa-hippo', 'fa-dove', 'fa-horse',
    'fa-meteor', 'fa-bolt', 'fa-fire', 'fa-water', 'fa-wind', 'fa-moon',
    'fa-star', 'fa-sun', 'fa-cloud', 'fa-tree', 'fa-mountain', 'fa-volcano',
    'fa-sword', 'fa-shield', 'fa-axe', 'fa-bow-arrow', 'fa-mace', 'fa-wand-sparkles',
    'fa-hat-cowboy', 'fa-helmet-safety', 'fa-boot', 'fa-shirt', 'fa-shoe-prints',
    'fa-chess-king', 'fa-chess-queen', 'fa-chess-knight', 'fa-chess-bishop', 'fa-chess-rook', 'fa-chess-pawn',
    'fa-dice-d6', 'fa-dice-d20', 'fa-puzzle-piece', 'fa-cubes', 'fa-cube',
    'fa-gem', 'fa-coin', 'fa-sack-dollar', 'fa-bag-shopping', 'fa-cart-shopping',
    'fa-key', 'fa-lock', 'fa-unlock', 'fa-trash', 'fa-pen', 'fa-eraser',
    'fa-music', 'fa-headphones', 'fa-microphone', 'fa-radio', 'fa-drum'
];

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
            if (tabName === 'categorias') carregarCategorias();
            if (tabName === 'produtos') carregarProdutos();
            if (tabName === 'withdraw') { /* não precisa carregar nada */ }
        });
    });

    carregarDashboard();
    carregarUsuarios(currentUserPage);
    carregarRanking();
    carregarCategorias();
    carregarProdutos();

    // Seletor PIX
    document.querySelectorAll('.pix-type-option').forEach(opt => {
        opt.addEventListener('click', function () {
            document.querySelectorAll('.pix-type-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('pixKeyType').value = this.dataset.value;
        });
    });

    document.getElementById('btnWithdraw').addEventListener('click', realizarSaque);

    // Modal de ações do usuário
    const modal = document.getElementById('userActionModal');
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Modal de ícone (global)
    const iconeModal = document.getElementById('iconeModal');
    const fecharIconeModal = document.getElementById('fecharIconeModal');
    fecharIconeModal.addEventListener('click', () => iconeModal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === iconeModal) iconeModal.classList.remove('active');
    });

    // Botões nova categoria/produto
    document.getElementById('novaCategoriaBtn').addEventListener('click', () => abrirModalCategoria());
    document.getElementById('novoProdutoBtn').addEventListener('click', () => abrirModalProduto());

    // Formulários de categoria e produto
    document.getElementById('categoriaForm').addEventListener('submit', salvarCategoria);
    document.getElementById('produtoForm').addEventListener('submit', salvarProduto);

    // Botões escolher ícone
    document.getElementById('escolherIconeCategoria').addEventListener('click', () => abrirSeletorIcone('categoria'));
    document.getElementById('escolherIconeProduto').addEventListener('click', () => abrirSeletorIcone('produto'));

    // Fechar modais de categoria/produto
    document.getElementById('fecharCategoriaModal').addEventListener('click', () => {
        document.getElementById('categoriaModal').classList.remove('active');
    });
    document.getElementById('fecharProdutoModal').addEventListener('click', () => {
        document.getElementById('produtoModal').classList.remove('active');
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
        console.log('Carregando usuários - página:', page);
        const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados recebidos:', data);

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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#f56565;">Erro ao carregar: ${error.message}</td></tr>`;
    }
}

// ========== RANKING ==========
async function carregarRanking() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const tbody = document.getElementById('rankingTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando...</td></tr>';

    try {
        console.log('Carregando ranking...');
        const response = await fetch(`${API_BASE_URL}/admin/ranking?limit=10`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Ranking recebido:', data);

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
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#f56565;">Erro ao carregar: ${error.message}</td></tr>`;
    }
}

// ========== CATEGORIAS ==========
async function carregarCategorias() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const tbody = document.getElementById('categoriasTableBody');
    tbody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/categorias`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const categorias = await response.json();

        let html = '';
        categorias.forEach(cat => {
            html += `<tr>
                <td>${cat.id}</td>
                <td><i class="fas ${cat.icone}"></i></td>
                <td>${cat.nome}</td>
                <td>${cat.slug}</td>
                <td>${cat.titulo}</td>
                <td>${cat.ordem}</td>
                <td>
                    <button class="action-btn" onclick="editarCategoria(${cat.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" onclick="excluirCategoria(${cat.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;

        // Atualiza select de categorias no modal de produto
        const selectCategoria = document.getElementById('produtoCategoriaId');
        selectCategoria.innerHTML = '<option value="">Selecione...</option>';
        categorias.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
        });

        // Atualiza filtro de produtos
        const filtro = document.getElementById('filtroCategoriaProdutos');
        filtro.innerHTML = '<option value="">Todas</option>';
        categorias.forEach(cat => {
            filtro.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
        });

    } catch (error) {
        console.error('Erro categorias:', error);
        tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar</td></tr>';
    }
}

async function salvarCategoria(e) {
    e.preventDefault();
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const id = document.getElementById('categoriaId').value;
    const dados = {
        nome: document.getElementById('categoriaNome').value,
        icone: document.getElementById('categoriaIcone').value,
        titulo: document.getElementById('categoriaTitulo').value,
        subtitulo: document.getElementById('categoriaSubtitulo').value,
        descricao: document.getElementById('categoriaDescricao').value,
        ordem: parseInt(document.getElementById('categoriaOrdem').value) || 0
    };

    const url = id ? `${API_BASE_URL}/admin/categorias/${id}` : `${API_BASE_URL}/admin/categorias`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify(dados)
        });
        const data = await response.json();
        if (response.ok) {
            alert(id ? 'Categoria atualizada!' : 'Categoria criada!');
            document.getElementById('categoriaModal').classList.remove('active');
            carregarCategorias();
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        alert('Erro de conexão');
    }
}

window.editarCategoria = async (id) => {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/categorias/${id}`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        const cat = await response.json();
        if (response.ok) {
            document.getElementById('categoriaId').value = cat.id;
            document.getElementById('categoriaNome').value = cat.nome;
            document.getElementById('categoriaIcone').value = cat.icone;
            document.getElementById('categoriaIconePreview').innerHTML = `<i class="fas ${cat.icone}"></i>`;
            document.getElementById('categoriaTitulo').value = cat.titulo;
            document.getElementById('categoriaSubtitulo').value = cat.subtitulo || '';
            document.getElementById('categoriaDescricao').value = cat.descricao || '';
            document.getElementById('categoriaOrdem').value = cat.ordem || 0;
            document.getElementById('categoriaModalTitle').textContent = 'Editar Categoria';
            document.getElementById('categoriaModal').classList.add('active');
        } else {
            alert('Erro ao carregar categoria');
        }
    } catch (error) {
        console.error('Erro ao editar categoria:', error);
        alert('Erro de conexão');
    }
};

window.excluirCategoria = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os produtos serão removidos.')) return;
    const userData = getUserData();
    if (!userData || !userData.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/categorias/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        const data = await response.json();
        if (response.ok) {
            alert('Categoria excluída!');
            carregarCategorias();
            carregarProdutos();
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        alert('Erro de conexão');
    }
};

function abrirModalCategoria() {
    document.getElementById('categoriaForm').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaIcone').value = 'fa-gamepad';
    document.getElementById('categoriaIconePreview').innerHTML = '<i class="fas fa-gamepad"></i>';
    document.getElementById('categoriaModalTitle').textContent = 'Nova Categoria';
    document.getElementById('categoriaModal').classList.add('active');
}

// ========== PRODUTOS ==========
async function carregarProdutos() {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const filtroCategoria = document.getElementById('filtroCategoriaProdutos').value;
    let url = `${API_BASE_URL}/admin/produtos`;
    if (filtroCategoria) url += `?categoria_id=${filtroCategoria}`;

    const tbody = document.getElementById('produtosTableBody');
    tbody.innerHTML = '<tr><td colspan="8">Carregando...</td></tr>';

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const produtos = await response.json();

        let html = '';
        produtos.forEach(prod => {
            html += `<tr>
                <td>${prod.id}</td>
                <td><i class="fas ${prod.icone}"></i></td>
                <td>${prod.nome}</td>
                <td>${prod.categoria_id}</td>
                <td>R$ ${Number(prod.preco).toFixed(2)}</td>
                <td>${prod.destaque ? 'Sim' : 'Não'}</td>
                <td>${prod.ativo ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="action-btn" onclick="editarProduto(${prod.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" onclick="excluirProduto(${prod.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Erro produtos:', error);
        tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar</td></tr>';
    }
}

async function salvarProduto(e) {
    e.preventDefault();
    const userData = getUserData();
    if (!userData || !userData.token) return;

    const id = document.getElementById('produtoId').value;
    const dados = {
        categoria_id: document.getElementById('produtoCategoriaId').value,
        nome: document.getElementById('produtoNome').value,
        preco: parseFloat(document.getElementById('produtoPreco').value),
        preco_antigo: document.getElementById('produtoPrecoAntigo').value ? parseFloat(document.getElementById('produtoPrecoAntigo').value) : null,
        info: document.getElementById('produtoInfo').value,
        icone: document.getElementById('produtoIcone').value,
        destaque: document.getElementById('produtoDestaque').checked,
        ativo: document.getElementById('produtoAtivo').checked
    };

    const url = id ? `${API_BASE_URL}/admin/produtos/${id}` : `${API_BASE_URL}/admin/produtos`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify(dados)
        });
        const data = await response.json();
        if (response.ok) {
            alert(id ? 'Produto atualizado!' : 'Produto criado!');
            document.getElementById('produtoModal').classList.remove('active');
            carregarProdutos();
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro de conexão');
    }
}

window.editarProduto = async (id) => {
    const userData = getUserData();
    if (!userData || !userData.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/produtos/${id}`, {
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        const prod = await response.json();
        if (response.ok) {
            document.getElementById('produtoId').value = prod.id;
            document.getElementById('produtoCategoriaId').value = prod.categoria_id;
            document.getElementById('produtoNome').value = prod.nome;
            document.getElementById('produtoPreco').value = prod.preco;
            document.getElementById('produtoPrecoAntigo').value = prod.preco_antigo || '';
            document.getElementById('produtoInfo').value = prod.info || '';
            document.getElementById('produtoIcone').value = prod.icone;
            document.getElementById('produtoIconePreview').innerHTML = `<i class="fas ${prod.icone}"></i>`;
            document.getElementById('produtoDestaque').checked = prod.destaque;
            document.getElementById('produtoAtivo').checked = prod.ativo;
            document.getElementById('produtoModalTitle').textContent = 'Editar Produto';
            document.getElementById('produtoModal').classList.add('active');
        } else {
            alert('Erro ao carregar produto');
        }
    } catch (error) {
        console.error('Erro ao editar produto:', error);
        alert('Erro de conexão');
    }
};

window.excluirProduto = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const userData = getUserData();
    if (!userData || !userData.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        const data = await response.json();
        if (response.ok) {
            alert('Produto excluído!');
            carregarProdutos();
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro de conexão');
    }
};

function abrirModalProduto() {
    document.getElementById('produtoForm').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoIcone').value = 'fa-box';
    document.getElementById('produtoIconePreview').innerHTML = '<i class="fas fa-box"></i>';
    document.getElementById('produtoDestaque').checked = false;
    document.getElementById('produtoAtivo').checked = true;
    document.getElementById('produtoModalTitle').textContent = 'Novo Produto';
    document.getElementById('produtoModal').classList.add('active');
}

// ========== SELETOR DE ÍCONE ==========
function abrirSeletorIcone(tipo) {
    const modal = document.getElementById('iconeModal');
    const grid = document.getElementById('iconeGrid');
    grid.innerHTML = iconesDisponiveis.map(icone =>
        `<div class="icone-item" data-icone="${icone}"><i class="fas ${icone}"></i></div>`
    ).join('');
    modal.classList.add('active');

    grid.querySelectorAll('.icone-item').forEach(item => {
        item.addEventListener('click', () => {
            const icone = item.dataset.icone;
            if (tipo === 'categoria') {
                document.getElementById('categoriaIconePreview').innerHTML = `<i class="fas ${icone}"></i>`;
                document.getElementById('categoriaIcone').value = icone;
            } else if (tipo === 'produto') {
                document.getElementById('produtoIconePreview').innerHTML = `<i class="fas ${icone}"></i>`;
                document.getElementById('produtoIcone').value = icone;
            }
            modal.classList.remove('active');
        });
    });
}

// ========== FILTRO DE PRODUTOS ==========
document.getElementById('filtroCategoriaProdutos').addEventListener('change', () => {
    carregarProdutos();
});

// ========== MODAL DE AÇÕES DO USUÁRIO ==========
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

// ========== EXECUÇÃO DAS AÇÕES ==========
window.executarAcao = async (acao, userId) => {
    document.getElementById('userActionModal').classList.remove('active');
    const userData = getUserData();
    if (!userData || !userData.token) return;

    let url = `${API_BASE_URL}/admin/users/${userId}`;
    let method = 'DELETE';
    let body = null;

    switch (acao) {
        case 'excluir':
            if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
            method = 'DELETE';
            url = `${API_BASE_URL}/admin/users/${userId}`;
            break;
        case 'senha':
            const novaSenha = prompt('Digite a nova senha (mínimo 6 caracteres):');
            if (!novaSenha || novaSenha.length < 6) {
                alert('Senha inválida ou muito curta');
                return;
            }
            method = 'PUT';
            url = `${API_BASE_URL}/admin/users/${userId}/password`;
            body = { newPassword: novaSenha };
            break;
        case 'addSaldo':
            const valorAdd = parseFloat(prompt('Digite o valor a adicionar (R$):'));
            if (isNaN(valorAdd) || valorAdd <= 0) {
                alert('Valor inválido');
                return;
            }
            method = 'PUT';
            url = `${API_BASE_URL}/admin/users/${userId}/add-balance`;
            body = { amount: valorAdd };
            break;
        case 'removeSaldo':
            const valorRem = parseFloat(prompt('Digite o valor a remover (R$):'));
            if (isNaN(valorRem) || valorRem <= 0) {
                alert('Valor inválido');
                return;
            }
            method = 'PUT';
            url = `${API_BASE_URL}/admin/users/${userId}/remove-balance`;
            body = { amount: valorRem };
            break;
        case 'tornarAdmin':
            const tornarAdmin = confirm('Deseja tornar este usuário administrador?');
            method = 'PUT';
            url = `${API_BASE_URL}/admin/users/${userId}/toggle-admin`;
            body = { is_admin: tornarAdmin };
            break;
        default:
            return;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Ação realizada com sucesso!');
            carregarUsuarios(currentUserPage);
            carregarDashboard();
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro na ação:', error);
        alert('Erro de conexão com o servidor');
    }
};

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