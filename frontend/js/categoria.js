const API_BASE_URL = 'https://pltrem.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {
    // Carrega a lista de categorias para o sidebar
    carregarCategorias();

    // Carrega a categoria inicial baseada na URL (?cat=nome-da-categoria)
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('cat') || 'bladeball'; // fallback
    carregarCategoria(slug);

    // Intercepta cliques nos links de categoria para navegação suave
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.categoria-lista a');
        if (link) {
            e.preventDefault();
            const url = new URL(link.href);
            const slug = url.searchParams.get('cat');
            if (slug) {
                history.pushState({ slug }, '', `?cat=${slug}`);
                carregarCategoria(slug);
                atualizarClasseAtiva(slug);
            }
        }
    });

    // Navegação pelo histórico do navegador
    window.addEventListener('popstate', (e) => {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('cat') || 'bladeball';
        carregarCategoria(slug);
        atualizarClasseAtiva(slug);
    });
});

async function carregarCategorias() {
    try {
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
        const slugAtivo = urlParams.get('cat') || 'bladeball';
        atualizarClasseAtiva(slugAtivo);

    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        document.getElementById('categoriaLista').innerHTML = '<li>Erro ao carregar</li>';
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
        const response = await fetch(`${API_BASE_URL}/categorias/${slug}`);
        if (!response.ok) throw new Error('Categoria não encontrada');

        const data = await response.json();
        const { categoria, produtos } = data;

        // Atualiza título e descrição
        const contentDiv = document.getElementById('conteudoCategoria');
        let html = `
            <h1>${categoria.titulo}</h1>
            <div class="descricao">${categoria.descricao || ''}</div>
            <div class="produtos-grid">
        `;

        if (produtos.length === 0) {
            html += '<p style="text-align:center; width:100%;">Nenhum produto disponível nesta categoria.</p>';
        } else {
            produtos.forEach(prod => {
                const precoFormatado = prod.preco.toFixed(2).replace('.', ',');
                const precoAntigoFormatado = prod.preco_antigo ? prod.preco_antigo.toFixed(2).replace('.', ',') : null;
                const icone = prod.icone || 'fa-box';

                html += `
                    <div class="produto-card">
                        <div class="produto-nome"><i class="fas ${icone}"></i> ${prod.nome}</div>
                        <div class="produto-preco">
                            R$ ${precoFormatado}
                            ${precoAntigoFormatado ? `<small>R$ ${precoAntigoFormatado}</small>` : ''}
                        </div>
                        <div class="produto-info">${prod.info || ''}</div>
                        <a href="checkout.html?produto=${encodeURIComponent(prod.nome)}&preco=${prod.preco}&categoria=${categoria.slug}" class="btn-checkout">
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
        document.getElementById('conteudoCategoria').innerHTML = '<p style="text-align:center;">Erro ao carregar produtos</p>';
    }
}