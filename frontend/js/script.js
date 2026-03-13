// script.js
document.addEventListener('DOMContentLoaded', function () {
    // Menu mobile
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.querySelector('.nav-menu');
    const headerActions = document.querySelector('.header-actions');

    if (mobileToggle && navMenu && headerActions) {
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

    // Simulação de usuários online (se existir o elemento)
    const usersSpan = document.getElementById('usersOnline');
    if (usersSpan) {
        setInterval(() => {
            const random = Math.floor(Math.random() * (250 - 100 + 1)) + 100;
            usersSpan.textContent = random;
        }, 5000);
    }
});