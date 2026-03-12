document.addEventListener('DOMContentLoaded', function () {
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

    // Validação do formulário de cadastro (exemplo)
    formCadastro.addEventListener('submit', function (e) {
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

        // Simulação de sucesso (futuramente enviará para o backend)
        console.log('Cadastro:', { username, email, password, discord });
        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        setActiveTab('login');

        // Limpar campos
        formCadastro.reset();
    });

    // Validação do formulário de login
    formLogin.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('Preencha usuário e senha');
            return;
        }

        // Simulação (futuramente fará requisição ao backend)
        console.log('Login:', { username, password });
        alert('Login efetuado com sucesso! (simulação)');

        // Redirecionar para página inicial ou painel
        // window.location.href = 'inicio.html';
    });
});