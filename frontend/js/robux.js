document.addEventListener('DOMContentLoaded', function () {
    // Elementos da calculadora
    const slider = document.getElementById('robuxSlider');
    const robuxSpan = document.getElementById('robuxValue');
    const priceSpan = document.getElementById('priceValue');
    const quickBtns = document.querySelectorAll('.quick-btn');
    const btnComprar = document.getElementById('btnComprarAgora');
    const formPagamento = document.getElementById('formPagamento');
    const btnConfirmar = document.getElementById('btnConfirmar');
    const modalOverlay = document.getElementById('modalOverlay');
    const fecharModal = document.getElementById('fecharModal');

    // Função para calcular preço (mesma do index)
    function updatePrice(robux) {
        const price = (robux * 0.0199).toFixed(2);
        robuxSpan.textContent = robux;
        priceSpan.textContent = `R$${price}`;
    }

    // Evento do slider
    slider.addEventListener('input', function () {
        updatePrice(this.value);
    });

    // Botões rápidos
    quickBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const robux = this.getAttribute('data-robux');
            slider.value = robux;
            updatePrice(robux);
        });
    });

    // Inicializar
    updatePrice(slider.value);

    // Comprar agora: mostrar formulário e rolar suavemente
    btnComprar.addEventListener('click', function (e) {
        e.preventDefault();
        // Mostrar formulário se estiver oculto
        if (!formPagamento.classList.contains('visible')) {
            formPagamento.classList.add('visible');
            // Rolar suavemente até o formulário
            setTimeout(() => {
                formPagamento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            // Se já estiver visível, só rola até ele
            formPagamento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // Confirmar compra: validar campos e abrir modal
    btnConfirmar.addEventListener('click', function () {
        const robloxUser = document.getElementById('robloxUser').value.trim();
        const email = document.getElementById('emailContato').value.trim();
        const discord = document.getElementById('discordUser').value.trim();

        if (!robloxUser || !email || !discord) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Validação simples de email
        if (!email.includes('@') || !email.includes('.')) {
            alert('Por favor, insira um e-mail válido.');
            return;
        }

        // Se tudo ok, abre o modal
        modalOverlay.classList.add('active');
        // Opcional: limpar campos? Não, pode manter preenchido.
    });

    // Fechar modal
    fecharModal.addEventListener('click', function () {
        modalOverlay.classList.remove('active');
    });

    // Clicar fora do modal fecha?
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // Menu mobile (mesmo do index)
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.querySelector('.nav-menu');
    const headerActions = document.querySelector('.header-actions');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (navMenu.style.display === 'flex') {
                navMenu.style.display = 'none';
                headerActions.style.display = 'none';
            } else {
                navMenu.style.display = 'flex';
                headerActions.style.display = 'flex';
                navMenu.style.flexDirection = 'column';
                navMenu.style.position = 'absolute';
                navMenu.style.top = '80px';
                navMenu.style.left = '20px';
                navMenu.style.right = '20px';
                navMenu.style.background = 'rgba(255,255,255,0.2)';
                navMenu.style.backdropFilter = 'blur(10px)';
                navMenu.style.borderRadius = '20px';
                navMenu.style.padding = '20px';
                navMenu.style.zIndex = '1000';
                headerActions.style.position = 'absolute';
                headerActions.style.top = '250px';
                headerActions.style.left = '20px';
                headerActions.style.right = '20px';
                headerActions.style.flexDirection = 'column';
                headerActions.style.background = 'rgba(255,255,255,0.2)';
                headerActions.style.backdropFilter = 'blur(10px)';
                headerActions.style.borderRadius = '20px';
                headerActions.style.padding = '20px';
                headerActions.style.zIndex = '1000';
            }
        });
    }
});