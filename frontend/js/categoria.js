const API_BASE_URL = 'https://pltrem.onrender.com/api';

// Funções de controle do loading
function mostrarLoading(mensagem = 'Carregando produtos...') {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.textContent = mensagem;
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function esconderLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
    // MOSTRA LOADING IMEDIATAMENTE AO CARREGAR A PÁGINA
    mostrarLoading('Iniciando servidor... Aguarde um momento');

    // Carrega a lista de categorias
    carregarCategorias();

    // Carrega a categoria inicial baseada na URL (?cat=nome-da-categoria)
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('cat') || '';

    // Se não houver slug na URL, primeiro carregamos as categorias para obter a primeira
    if (!slug) {
        // Aguarda as categorias carregarem e pega a primeira
        carregarCategorias().then(() => {
            const primeiraCategoria = obterPrimeiraCategoria();
            if (primeiraCategoria) {
                atualizarURL(primeiraCategoria);
                carregarCategoria(primeiraCategoria).finally(() => esconderLoading());
            } else {
                esconderLoading();
            }
        }).catch(() => esconderLoading());
    } else {
        // Carrega a categoria específica
        carregarCategoria(slug).finally(() => esconderLoading());
    }

    // Intercepta cliques nos links de categoria para navegação suave
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.categoria-lista a');
        if (link) {
            e.preventDefault();
            const url = new URL(link.href);
            const slug = url.searchParams.get('cat');
            if (slug) {
                mostrarLoading('Carregando produtos...');
                atualizarURL(slug);
                carregarCategoria(slug).finally(() => esconderLoading());
                atualizarClasseAtiva(slug);
            }
        }
    });

    // Navegação pelo histórico do navegador
    window.addEventListener('popstate', (e) => {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('cat');
        if (slug) {
            mostrarLoading('Carregando produtos...');
            carregarCategoria(slug).finally(() => esconderLoading());
            atualizarClasseAtiva(slug);
        }
    });
});

function atualizarURL(slug) {
    history.pushState({ slug }, '', `?cat=${slug}`);
}

function obterPrimeiraCategoria() {
    const primeiroLink = document.querySelector('.categoria-lista a');
    if (primeiroLink) {
        const url = new URL(primeiroLink.href);
        return url.searchParams.get('cat');
    }
    return null;
}

async function carregarCategorias() {
    try {
        console.log('Carregando categorias...');
        const response = await fetch(`${API_BASE_URL}/categorias`);
        if (!response.ok) throw new Error('Erro ao carregar categorias');
        const categorias = await response.json();

        const lista = document.getElementById('categoriaLista');
        lista.innerHTML = '';

        categorias.forEach(cat => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `?cat=${cat.slug}`;
            a.innerHTML = `<i class="fas ${cat.icone}"></i> ${cat.nome}`;
            li.appendChild(a);
            lista.appendChild(li);
        });

        // Destacar categoria ativa
        const urlParams = new URLSearchParams(window.location.search);
        const slugAtivo = urlParams.get('cat');
        if (slugAtivo) {
            atualizarClasseAtiva(slugAtivo);
        }

        return categorias;
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        document.getElementById('categoriaLista').innerHTML = '<li>Erro ao carregar</li>';
        throw error;
    }
}

function atualizarClasseAtiva(slug) {
    const links = document.querySelectorAll('.categoria-lista a');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.href.includes(`cat=${slug}`)) {
            link.classList.add('active');
        }
    });
}

async function carregarCategoria(slug) {
    try {
        console.log('Carregando categoria:', slug);
        const response = await fetch(`${API_BASE_URL}/categorias/${slug}`);
        if (!response.ok) throw new Error('Categoria não encontrada');

        const data = await response.json();
        const { categoria, produtos } = data;

        const contentDiv = document.getElementById('conteudoCategoria');
        let html = `
            <h1>${categoria.titulo || categoria.nome}</h1>
            <div class="descricao">${categoria.descricao || ''}</div>
            <div class="produtos-grid">
        `;

        if (!produtos || produtos.length === 0) {
            html += '<p style="text-align:center; width:100%;">Nenhum produto disponível nesta categoria.</p>';
        } else {
            produtos.forEach(prod => {
                const preco = parseFloat(prod.preco) || 0;
                const precoAntigo = prod.preco_antigo ? parseFloat(prod.preco_antigo) : null;

                const precoFormatado = preco.toFixed(2).replace('.', ',');
                const precoAntigoFormatado = precoAntigo ? precoAntigo.toFixed(2).replace('.', ',') : null;
                const icone = prod.icone || 'fa-box';

                html += `
                    <div class="produto-card">
                        <div class="produto-nome"><i class="fas ${icone}"></i> ${prod.nome}</div>
                        <div class="produto-preco">
                            R$ ${precoFormatado}
                            ${precoAntigoFormatado ? `<small>R$ ${precoAntigoFormatado}</small>` : ''}
                        </div>
                        <div class="produto-info">${prod.info || ''}</div>
                        <a href="checkout.html?produto=${encodeURIComponent(prod.nome)}&preco=${preco}&categoria=${categoria.slug}" class="btn-checkout">
                            <i class="fas fa-shopping-cart"></i> Comprar
                        </a>
                    </div>
                `;
            });
        }

        html += `</div>`;
        contentDiv.innerHTML = html;

    } catch (error) {
        console.error('Erro ao carregar categoria:', error);
        document.getElementById('conteudoCategoria').innerHTML = '<p style="text-align:center;">Erro ao carregar produtos. Tente novamente mais tarde.</p>';
        throw error;
    }
}