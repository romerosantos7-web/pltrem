// login.js - Versão com armazenamento de token e dados do usuário por 7 dias

const API_BASE_URL = 'https://pltrem.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {
    const tabLogin = document.getElementById('tabLogin');
    const tabCadastro = document.getElementById('tabCadastro');
    const formLogin = document.getElementById('loginForm');
    const formCadastro = document.getElementById('cadastroForm');
    const switchToCadastro = document.getElementById('switchToCadastro');
    const switchToLogin = document.getElementById('switchToLogin');

    function setActiveTab(tab) {
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabCadastro.classList.remove('active');
            formLogin.classList.add('active');
            formCadastro.classList.remove('active');
        } else {
            tabCadastro.classList.add('active');
            tabLogin.classList.remove('active');
            formCadastro.classList.add('active');
            formLogin.classList.remove('active');
        }
    }

    tabLogin.addEventListener('click', () => setActiveTab('login'));
    tabCadastro.addEventListener('click', () => setActiveTab('cadastro'));

    if (switchToCadastro) {
        switchToCadastro.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveTab('cadastro');
        });
    }
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveTab('login');
        });
    }

    // Cadastro
    formCadastro.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('cadastroUsername').value.trim();
        const email = document.getElementById('cadastroEmail').value.trim();
        const password = document.getElementById('cadastroPassword').value;
        const discord = document.getElementById('cadastroDiscord').value.trim();

        if (!username || !email || !password) {
            alert('Preencha todos os campos obrigatórios (*)');
            return;
        }
        if (password.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            alert('E-mail inválido');
            return;
        }

        const submitBtn = formCadastro.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, discord })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso! Faça login para continuar.');
                formCadastro.reset();
                setActiveTab('login');
            } else {
                alert(data.error || 'Erro ao cadastrar. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro de conexão com o servidor. Verifique sua internet.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Cadastrar';
        }
    });

    // Login
    formLogin.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('Preencha usuário e senha');
            return;
        }

        const submitBtn = formLogin.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Salva token e dados do usuário com timestamp de expiração (7 dias)
                const now = new Date();
                const expiresAt = now.getTime() + 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

                const userData = {
                    token: data.token,
                    user: data.user,
                    expiresAt: expiresAt
                };

                localStorage.setItem('rbx_user', JSON.stringify(userData));

                alert('Login efetuado com sucesso!');
                window.location.href = 'inicio.html';
            } else {
                alert(data.error || 'Usuário ou senha inválidos');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro de conexão com o servidor. Verifique sua internet.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Entrar';
        }
    });
});