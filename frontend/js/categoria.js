const API_PUBLIC = 'https://pltrem.onrender.com/api/public';

document.addEventListener('DOMContentLoaded', function () {
    carregarCategorias();

    // Carrega categoria inicial baseada na URL
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('cat');
    if (catId) carregarCategoria(catId);
    else carregarCategoria('primeira'); // ou carrega a primeira disponível

    // Intercepta cliques nos links de categoria
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.categoria-lista a');
        if (link) {
            e.preventDefault();
            const catId = link.dataset.id;
            history.pushState({ catId }, '', `?cat=${catId}`);
            carregarCategoria(catId);
            atualizarClasseAtiva(catId);
        }
    });

    window.addEventListener('popstate', (e) => {
        const params = new URLSearchParams(window.location.search);
        const catId = params.get('cat');
        if (catId) carregarCategoria(catId);
    });
});

function carregarCategorias() {
    fetch(`${API_PUBLIC}/categorias`)
        .then(res => res.json())
        .then(categorias => {
            const lista = document.getElementById('categoriaLista');
            lista.innerHTML = categorias.map(cat => `
                <li><a href="#" data-id="${cat.id}"><i class="fas ${cat.icone}"></i> ${cat.nome}</a></li>
            `).join('');

            const urlParams = new URLSearchParams(window.location.search);
            const catId = urlParams.get('cat') || (categorias[0]?.id);
            if (catId) {
                atualizarClasseAtiva(catId);
                if (!urlParams.get('cat')) {
                    history.replaceState({ catId }, '', `?cat=${catId}`);
                    carregarCategoria(catId);
                }
            }
        });
}

function atualizarClasseAtiva(catId) {
    document.querySelectorAll('.categoria-lista a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.id == catId) link.classList.add('active');
    });
}

function carregarCategoria(catId) {
    fetch(`${API_PUBLIC}/categorias/${catId}`)
        .then(res => res.json())
        .then(data => {
            const contentDiv = document.getElementById('conteudoCategoria');
            let html = `
                <h1>${data.titulo}</h1>
                <div class="descricao">${data.descricao}</div>
                <div class="produtos-grid">
            `;
            data.produtos.forEach(prod => {
                const precoFormatado = prod.preco.toFixed(2).replace('.', ',');
                const precoAntigoFormatado = prod.preco_antigo ? prod.preco_antigo.toFixed(2).replace('.', ',') : null;
                html += `
                    <div class="produto-card">
                        <div class="produto-nome"><i class="fas ${prod.icone || 'fa-box'}"></i> ${prod.nome}</div>
                        <div class="produto-preco">
                            R$ ${precoFormatado}
                            ${precoAntigoFormatado ? `<small>R$ ${precoAntigoFormatado}</small>` : ''}
                        </div>
                        <div class="produto-info">${prod.info}</div>
                        <a href="checkout.html?produto=${encodeURIComponent(prod.nome)}&preco=${prod.preco}&categoria=${catId}" class="btn-checkout">
                            <i class="fas fa-shopping-cart"></i> Comprar
                        </a>
                    </div>
                `;
            });
            html += `</div>`;
            contentDiv.innerHTML = html;
        });
}