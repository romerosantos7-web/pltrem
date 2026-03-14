// script.js - Versão final com gerenciamento de usuário, sidebar e adaptações mobile

document.addEventListener('DOMContentLoaded', function () {
    // ========== SIDEBAR ==========
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', openSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Fechar sidebar ao clicar em um link (exceto se for o logout)
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a:not(#logoutSidebar)');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // ========== GERENCIAMENTO DE USUÁRIO ==========
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

    function logout() {
        localStorage.removeItem('rbx_user');
        window.location.reload();
    }

    function updateUIForUser() {
        const userData = getUserData();
        const headerActions = document.querySelector('.header-actions');
        const sidebarNav = document.querySelector('.sidebar-nav ul');
        const saldoBtn = document.querySelector('.saldo-btn');
        const isMobile = window.innerWidth <= 768;

        if (!headerActions) return;

        // Remove elementos dinâmicos antigos
        const existingUserMenu = document.querySelector('.user-menu-container');
        if (existingUserMenu) existingUserMenu.remove();

        const existingSidebarUser = document.querySelector('.sidebar-user-info');
        if (existingSidebarUser) existingSidebarUser.remove();

        const existingLogoutSidebar = document.getElementById('logoutSidebar');
        if (existingLogoutSidebar) existingLogoutSidebar.remove();

        if (userData) {
            const username = userData.user.username;
            const saldo = userData.user.saldo || 0;
            const saldoFormatado = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Atualiza displays de saldo
            const saldoDisplay = document.getElementById('saldoDisplay');
            const saldoAtual = document.getElementById('saldoAtual');
            if (saldoDisplay) saldoDisplay.textContent = saldoFormatado;
            if (saldoAtual) saldoAtual.textContent = saldoFormatado;

            // Mostra o botão de saldo (se estava oculto)
            if (saldoBtn) saldoBtn.style.display = 'inline-flex';

            // Cria menu do usuário no header (desktop)
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu-container';
            userMenu.innerHTML = `
                <button class="user-menu-button">
                    <i class="fas fa-user-circle"></i> ${username} <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown">
                    <a href="#" id="profileLink"><i class="fas fa-id-card"></i> Meu perfil</a>
                    <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Sair</a>
                </div>
            `;
            headerActions.appendChild(userMenu);

            // Dropdown toggle
            const menuButton = userMenu.querySelector('.user-menu-button');
            const dropdown = userMenu.querySelector('.user-dropdown');
            menuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });

            // Fecha dropdown ao clicar fora
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });

            // Logout
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });

            // Perfil (futuro)
            document.getElementById('profileLink').addEventListener('click', (e) => {
                e.preventDefault();
                alert('Página de perfil em desenvolvimento');
            });

            // Adiciona informações no sidebar (para mobile e desktop)
            const userLi = document.createElement('li');
            userLi.className = 'sidebar-user-info';
            userLi.innerHTML = `
                <div class="sidebar-user">
                    <i class="fas fa-user-circle"></i> <span>${username}</span>
                </div>
                <div class="sidebar-saldo">
                    <i class="fas fa-wallet"></i> Saldo: ${saldoFormatado}
                </div>
            `;
            sidebarNav.appendChild(userLi);

            // Adiciona botão de logout no sidebar (para mobile)
            const logoutLi = document.createElement('li');
            logoutLi.id = 'logoutSidebar';
            logoutLi.innerHTML = '<a href="#"><i class="fas fa-sign-out-alt"></i> Sair da conta</a>';
            logoutLi.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            sidebarNav.appendChild(logoutLi);

            // Remove o link "Entrar" do sidebar se existir
            const loginLink = Array.from(sidebarNav.querySelectorAll('li')).find(li =>
                li.textContent.includes('Entrar') || li.textContent.includes('Cadastrar')
            );
            if (loginLink) loginLink.remove();

        } else {
            // Usuário não logado: esconde o botão de saldo
            if (saldoBtn) saldoBtn.style.display = 'none';

            // Remove o link de logout do sidebar se existir
            const logoutLi = document.getElementById('logoutSidebar');
            if (logoutLi) logoutLi.remove();

            // Garante que o link "Entrar" exista no sidebar
            const loginLinkExists = Array.from(sidebarNav.querySelectorAll('li')).some(li =>
                li.textContent.includes('Entrar')
            );
            if (!loginLinkExists) {
                const loginLi = document.createElement('li');
                loginLi.innerHTML = '<a href="login.html"><i class="fas fa-sign-in-alt"></i> Entrar / Cadastrar</a>';
                sidebarNav.appendChild(loginLi);
            }
        }
    }

    // Atualiza UI ao carregar a página
    updateUIForUser();

    // Reavalia ao redimensionar a tela (para mobile/desktop)
    window.addEventListener('resize', () => {
        updateUIForUser();
    });

    // ========== PROTEÇÃO DE ROTAS ==========
    // Redireciona para login se tentar acessar páginas que exigem autenticação
    const protectedPages = ['saldo.html']; // Adicione outras páginas que exigem login
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage) && !getUserData()) {
        window.location.href = 'login.html';
    }

    // ========== MENU MOBILE ANTIGO (fallback) ==========
    const mobileToggle = document.getElementById('mobileToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            // Se não houver sidebar, usa o antigo menu (fallback)
            if (!sidebar) {
                const navMenu = document.querySelector('.nav-menu');
                const headerActions = document.querySelector('.header-actions');
                if (navMenu) {
                    if (navMenu.style.display === 'flex') {
                        navMenu.style.display = 'none';
                        if (headerActions) headerActions.style.display = 'none';
                    } else {
                        navMenu.style.display = 'flex';
                        if (headerActions) headerActions.style.display = 'flex';
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
                        if (headerActions) {
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
                    }
                }
            }
        });
    }
});