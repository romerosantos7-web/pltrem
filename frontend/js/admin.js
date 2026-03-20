const API_BASE_URL = 'https://pltrem.onrender.com/api';
let currentCategoriaPage = 1;
let currentUserId = null;

// Lista de ícones disponíveis (60 ícones)
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
    if (!userData) { window.location.href = 'login.html'; return; }
    if (!userData.user.is_admin) { alert('Acesso negado.'); window.location.href = 'index.html'; return; }

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
            if (tabName === 'categorias') carregarCategorias();
            if (tabName === 'produtos') carregarProdutos();
        });
    });

    carregarDashboard();
    carregarCategorias();
    carregarProdutos();

    // Inicializar seletor de tipo PIX
    document.querySelectorAll('.pix-type-option').forEach(opt => {
        opt.addEventListener('click', function () {
            document.querySelectorAll('.pix-type-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('pixKeyType').value = this.dataset.value;
        });
    });
    document.getElementById('btnWithdraw').addEventListener('click', realizarSaque);

    // Modal de ícone
    const iconeModal = document.getElementById('iconeModal');
    document.getElementById('fecharIconeModal').addEventListener('click', () => iconeModal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === iconeModal) iconeModal.classList.remove('active'); });

    // Botões de nova categoria/produto
    document.getElementById('novaCategoriaBtn').addEventListener('click', () => abrirModalCategoria());
    document.getElementById('novoProdutoBtn').addEventListener('click', () => abrirModalProduto());

    // Fechar modais de categoria e produto
    document.getElementById('fecharCategoriaModal').addEventListener('click', () => document.getElementById('categoriaModal').classList.remove('active'));
    document.getElementById('fecharProdutoModal').addEventListener('click', () => document.getElementById('produtoModal').classList.remove('active'));

    // Submissão dos formulários
    document.getElementById('categoriaForm').addEventListener('submit', salvarCategoria);
    document.getElementById('produtoForm').addEventListener('submit', salvarProduto);

    // Botões de escolher ícone
    document.getElementById('escolherIconeCategoria').addEventListener('click', () => abrirSeletorIcone('categoria'));
    document.getElementById('escolherIconeProduto').addEventListener('click', () => abrirSeletorIcone('produto'));
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
    } catch { return null; }
}

// ========== DASHBOARD ==========
async function carregarDashboard() {
    const userData = getUserData();
    if (!userData?.token) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        if (!res.ok) throw new Error('Erro');
        const data = await res.json();
        document.getElementById('misticpayBalance').textContent = `R$ ${Number(data.misticpay_balance || 0).toFixed(2)}`;
        document.getElementById('totalAdicionado').textContent = `R$ ${Number(data.total_adicionado || 0).toFixed(2)}`;
        document.getElementById('totalGasto').textContent = `R$ ${Number(data.total_gasto || 0).toFixed(2)}`;
        document.getElementById('totalTransacoes').textContent = data.total_transacoes || 0;
        document.getElementById('totalUsuarios').textContent = data.total_usuarios || 0;
        document.getElementById('totalCompras').textContent = data.total_compras || 0;
    } catch (error) { console.error('Erro dashboard:', error); }
}

// ========== CATEGORIAS ==========
async function carregarCategorias() {
    const userData = getUserData();
    const tbody = document.getElementById('categoriasTableBody');
    tbody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
    try {
        const res = await fetch(`${API_BASE_URL}/admin/categorias`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        if (!res.ok) throw new Error('Erro');
        const categorias = await res.json();
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
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar</td></tr>';
        console.error(error);
    }
}

async function salvarCategoria(e) {
    e.preventDefault();
    const userData = getUserData();
    const id = document.getElementById('categoriaId').value;
    const dados = {
        nome: document.getElementById('categoriaNome').value,
        icone: document.getElementById('categoriaIcone').value,
        titulo: document.getElementById('categoriaTitulo').value,
        subtitulo: document.getElementById('categoriaSubtitulo').value,
        descricao: document.getElementById('categoriaDescricao').value,
        ordem: parseInt(document.getElementById('categoriaOrdem').value) || 0
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/admin/categorias/${id}` : `${API_BASE_URL}/admin/categorias`;
    try {
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userData.token}` },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            alert(id ? 'Categoria atualizada' : 'Categoria criada');
            document.getElementById('categoriaModal').classList.remove('active');
            carregarCategorias();
        } else {
            const err = await res.json();
            alert('Erro: ' + err.error);
        }
    } catch (error) { alert('Erro de conexão'); }
}

window.editarCategoria = async (id) => {
    const userData = getUserData();
    try {
        const res = await fetch(`${API_BASE_URL}/admin/categorias/${id}`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        const cat = await res.json();
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
    } catch (error) { alert('Erro ao carregar categoria'); }
};

window.excluirCategoria = async (id) => {
    if (!confirm('Excluir esta categoria? Isso também excluirá todos os produtos associados.')) return;
    const userData = getUserData();
    try {
        const res = await fetch(`${API_BASE_URL}/admin/categorias/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${userData.token}` } });
        if (res.ok) {
            alert('Categoria excluída');
            carregarCategorias();
            carregarProdutos(); // atualiza lista de produtos
        } else {
            alert('Erro ao excluir');
        }
    } catch (error) { alert('Erro de conexão'); }
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
    const tbody = document.getElementById('produtosTableBody');
    tbody.innerHTML = '<tr><td colspan="8">Carregando...</td></tr>';
    const filtroCategoria = document.getElementById('filtroCategoriaProdutos').value;
    let url = `${API_BASE_URL}/admin/produtos`;
    if (filtroCategoria) url += `?categoria_id=${filtroCategoria}`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        if (!res.ok) throw new Error('Erro');
        const produtos = await res.json();
        // Carregar categorias para exibir nomes
        const catRes = await fetch(`${API_BASE_URL}/admin/categorias`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        const categorias = await catRes.json();
        const catMap = Object.fromEntries(categorias.map(c => [c.id, c.nome]));
        let html = '';
        produtos.forEach(p => {
            html += `<tr>
                <td>${p.id}</td>
                <td><i class="fas ${p.icone}"></i></td>
                <td>${p.nome}</td>
                <td>${catMap[p.categoria_id] || '-'}</td>
                <td>R$ ${Number(p.preco).toFixed(2)}</td>
                <td>${p.destaque ? 'Sim' : 'Não'}</td>
                <td>${p.ativo ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="action-btn" onclick="editarProduto(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" onclick="excluirProduto(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar</td></tr>';
        console.error(error);
    }
}

async function salvarProduto(e) {
    e.preventDefault();
    const userData = getUserData();
    const id = document.getElementById('produtoId').value;
    const dados = {
        categoria_id: parseInt(document.getElementById('produtoCategoriaId').value),
        nome: document.getElementById('produtoNome').value,
        preco: parseFloat(document.getElementById('produtoPreco').value),
        preco_antigo: parseFloat(document.getElementById('produtoPrecoAntigo').value) || null,
        info: document.getElementById('produtoInfo').value,
        icone: document.getElementById('produtoIcone').value,
        destaque: document.getElementById('produtoDestaque').checked,
        ativo: document.getElementById('produtoAtivo').checked
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/admin/produtos/${id}` : `${API_BASE_URL}/admin/produtos`;
    try {
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userData.token}` },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            alert(id ? 'Produto atualizado' : 'Produto criado');
            document.getElementById('produtoModal').classList.remove('active');
            carregarProdutos();
        } else {
            const err = await res.json();
            alert('Erro: ' + err.error);
        }
    } catch (error) { alert('Erro de conexão'); }
}

window.editarProduto = async (id) => {
    const userData = getUserData();
    try {
        const res = await fetch(`${API_BASE_URL}/admin/produtos/${id}`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        const prod = await res.json();
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
    } catch (error) { alert('Erro ao carregar produto'); }
};

window.excluirProduto = async (id) => {
    if (!confirm('Excluir este produto?')) return;
    const userData = getUserData();
    try {
        const res = await fetch(`${API_BASE_URL}/admin/produtos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${userData.token}` } });
        if (res.ok) {
            alert('Produto excluído');
            carregarProdutos();
        } else {
            alert('Erro ao excluir');
        }
    } catch (error) { alert('Erro de conexão'); }
};

async function abrirModalProduto() {
    // Carregar categorias para o select
    const userData = getUserData();
    const select = document.getElementById('produtoCategoriaId');
    select.innerHTML = '<option value="">Carregando...</option>';
    try {
        const res = await fetch(`${API_BASE_URL}/admin/categorias`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
        const categorias = await res.json();
        select.innerHTML = '<option value="">Selecione...</option>';
        categorias.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
        });
    } catch (error) {
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
    document.getElementById('produtoForm').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoIcone').value = 'fa-box';
    document.getElementById('produtoIconePreview').innerHTML = '<i class="fas fa-box"></i>';
    document.getElementById('produtoDestaque').checked = false;
    document.getElementById('produtoAtivo').checked = true;
    document.getElementById('produtoModalTitle').textContent = 'Novo Produto';
    document.getElementById('produtoModal').classList.add('active');
}

// Atualiza o filtro de produtos quando a categoria é selecionada
document.getElementById('filtroCategoriaProdutos').addEventListener('change', carregarProdutos);

// ========== SELEÇÃO DE ÍCONES ==========
function abrirSeletorIcone(tipo) {
    const modal = document.getElementById('iconeModal');
    const grid = document.getElementById('iconeGrid');
    grid.innerHTML = iconesDisponiveis.map(icone => `<div class="icone-item" data-icone="${icone}"><i class="fas ${icone}"></i></div>`).join('');
    modal.classList.add('active');

    grid.querySelectorAll('.icone-item').forEach(item => {
        item.addEventListener('click', () => {
            const icone = item.dataset.icone;
            if (tipo === 'categoria') {
                document.getElementById('categoriaIconePreview').innerHTML = `<i class="fas ${icone}"></i>`;
                document.getElementById('categoriaIcone').value = icone;
            } else {
                document.getElementById('produtoIconePreview').innerHTML = `<i class="fas ${icone}"></i>`;
                document.getElementById('produtoIcone').value = icone;
            }
            modal.classList.remove('active');
        });
    });
}

// ========== SAQUE ==========
async function realizarSaque() {
    const userData = getUserData();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const pixKeyType = document.getElementById('pixKeyType').value;
    const pixKey = document.getElementById('pixKey').value.trim();
    const description = document.getElementById('withdrawDescription').value.trim() || 'Saque admin';
    const feedback = document.getElementById('withdrawFeedback');

    if (!amount || amount < 5) { feedback.innerHTML = '<div class="feedback-error">Valor mínimo R$ 5,00</div>'; return; }
    if (!pixKey) { feedback.innerHTML = '<div class="feedback-error">Chave PIX obrigatória</div>'; return; }

    const btn = document.getElementById('btnWithdraw');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    feedback.innerHTML = '';
    try {
        const res = await fetch(`${API_BASE_URL}/admin/withdraw`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userData.token}` },
            body: JSON.stringify({ amount, pixKey, pixKeyType, description })
        });
        const data = await res.json();
        if (res.ok) {
            feedback.innerHTML = '<div class="feedback-success">Saque realizado!</div>';
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('pixKey').value = '';
            carregarDashboard();
        } else { feedback.innerHTML = `<div class="feedback-error">${data.error || 'Erro'}</div>`; }
    } catch (error) { feedback.innerHTML = '<div class="feedback-error">Erro de conexão</div>'; }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Realizar Saque'; }
}