// Atualização da calculadora de Robux
document.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('robuxSlider');
    const robuxSpan = document.getElementById('robuxValue');
    const priceSpan = document.getElementById('priceValue');
    const quickBtns = document.querySelectorAll('.quick-btn');

    // Função para calcular preço (exemplo: $0.0199 por Robux)
    function updatePrice(robux) {
        const price = (robux * 0.0199).toFixed(2);
        robuxSpan.textContent = robux;
        priceSpan.textContent = `$${price}`;
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

    // Inicializar com valor padrão
    updatePrice(slider.value);

    // Simulação de usuários online (número aleatório para interatividade)
    const usersSpan = document.getElementById('usersOnline');
    if (usersSpan) {
        setInterval(() => {
            const random = Math.floor(Math.random() * (250 - 100 + 1)) + 100;
            usersSpan.textContent = random;
        }, 5000);
    }

    // Menu mobile toggle (simples)
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
                // Para mobile, colocar coluna
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

    // Remover o overlay de scan após a animação (opcional)
    const scanOverlay = document.querySelector('.scan-overlay');
    if (scanOverlay) {
        setTimeout(() => {
            scanOverlay.remove();
        }, 1500); // tempo igual à duração da animação
    }
});

async function carregarSaldo() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('https://pltrem.onrender.com/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            document.getElementById('saldoDisplay').textContent =
                user.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    } catch (error) {
        console.error('Erro ao carregar saldo:', error);
    }
}

// Chamar a função ao carregar a página (se o token existir)
carregarSaldo();