document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://pltrem.onrender.com/api'; // URL base da API

    // Elementos das abas
    const tabLogin = document.getElementById('tabLogin');
    const tabCadastro = document.getElementById('tabCadastro');
    const formLogin = document.getElementById('loginForm');
    const formCadastro = document.getElementById('cadastroForm');

    // Links para alternar entre formulários
    const switchToCadastro = document.getElementById('switchToCadastro');
    const switchToLogin = document.getElementById('switchToLogin');

    // Função para trocar aba
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

    // Eventos das abas
    tabLogin.addEventListener('click', () => setActiveTab('login'));
    tabCadastro.addEventListener('click', () => setActiveTab('cadastro'));

    // Eventos dos links
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

    // ------------------- CADASTRO -------------------
    formCadastro.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('cadastroUsername').value.trim();
        const email = document.getElementById('cadastroEmail').value.trim();
        const password = document.getElementById('cadastroPassword').value;
        const discord = document.getElementById('cadastroDiscord').value.trim();

        // Validações básicas
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

        // Desabilitar botão para evitar envios duplicados
        const submitBtn = formCadastro.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cadastrando...';

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
                // Exibe mensagem de erro retornada pela API
                alert(data.error || 'Erro ao cadastrar. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro de conexão com o servidor. Verifique sua internet.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar';
        }
    });

    // ------------------- LOGIN -------------------
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
        submitBtn.textContent = 'Entrando...';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Salva o token JWT no localStorage
                localStorage.setItem('token', data.token);
                // Opcional: salvar dados do usuário
                localStorage.setItem('user', JSON.stringify(data.user));

                alert('Login efetuado com sucesso!');
                // Redirecionar para a página inicial (ou painel)
                window.location.href = 'inicio.html'; // ajuste conforme sua página inicial
            } else {
                alert(data.error || 'Usuário ou senha inválidos');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro de conexão com o servidor. Verifique sua internet.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
});