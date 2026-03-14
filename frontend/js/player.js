// player.js - Player de música flutuante com persistência entre páginas

(function () {
    // Evita múltiplas inicializações
    if (window.playerInitialized) return;
    window.playerInitialized = true;

    // Lista de músicas (nomes dos arquivos na pasta audio)
    const musicas = [
        { nome: 'Passo com a bunda e Sarro', arquivo: 'musica1.mp3' },
        { nome: 'VEIGH - Artista Genérico (Eu Venci o Mundo)', arquivo: 'musica2.mp3' },
        { nome: 'Matuê - É Sal', arquivo: 'musica3.mp3' },
        { nome: 'Eminem - Mockingbird', arquivo: 'musica4.mp3' },
        { nome: 'Ritmo Lilly Wood', arquivo: 'musica5.mp3' }
    ];

    // Chaves para localStorage
    const STORAGE_INDEX = 'player_indice';
    const STORAGE_TIME = 'player_tempo';
    const STORAGE_PLAYING = 'player_playing';

    // Estado global
    let indiceAtual = 0;
    let audio = new Audio();
    let isPlaying = false;
    let isMinimized = false;
    let wasPlayingBeforeNav = false; // para controle

    // Carregar estado salvo
    function carregarEstado() {
        try {
            const savedIndex = localStorage.getItem(STORAGE_INDEX);
            if (savedIndex !== null) {
                indiceAtual = parseInt(savedIndex, 10);
                if (indiceAtual < 0 || indiceAtual >= musicas.length) indiceAtual = 0;
            }

            const savedTime = localStorage.getItem(STORAGE_TIME);
            if (savedTime !== null) {
                audio.currentTime = parseFloat(savedTime);
            }

            const savedPlaying = localStorage.getItem(STORAGE_PLAYING);
            if (savedPlaying === 'true') {
                wasPlayingBeforeNav = true;
            }
        } catch (e) {
            console.warn('Erro ao carregar estado do player:', e);
        }
    }

    // Salvar estado atual
    function salvarEstado() {
        try {
            localStorage.setItem(STORAGE_INDEX, indiceAtual);
            localStorage.setItem(STORAGE_TIME, audio.currentTime);
            localStorage.setItem(STORAGE_PLAYING, isPlaying);
        } catch (e) {
            console.warn('Erro ao salvar estado do player:', e);
        }
    }

    // Carregar música atual
    function carregarMusica(index) {
        if (index < 0 || index >= musicas.length) return;
        const musica = musicas[index];
        audio.src = `audio/${musica.arquivo}`;
        audio.load();
        // Atualizar nome na interface
        const nomeEl = document.getElementById('player-musica-nome');
        if (nomeEl) nomeEl.textContent = musica.nome;
    }

    // Play/Pause
    function togglePlay() {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(e => console.warn('Erro ao reproduzir:', e));
        }
        isPlaying = !isPlaying;
        atualizarInterface();
    }

    // Avançar música
    function proximaMusica() {
        indiceAtual = (indiceAtual + 1) % musicas.length;
        carregarMusica(indiceAtual);
        if (isPlaying) {
            audio.play().catch(e => console.warn('Erro ao reproduzir:', e));
        }
        atualizarInterface();
    }

    // Voltar música (opcional, mas pode ser útil)
    function musicaAnterior() {
        indiceAtual = (indiceAtual - 1 + musicas.length) % musicas.length;
        carregarMusica(indiceAtual);
        if (isPlaying) {
            audio.play().catch(e => console.warn('Erro ao reproduzir:', e));
        }
        atualizarInterface();
    }

    // Atualizar ícone play/pause e outros elementos
    function atualizarInterface() {
        const playBtn = document.getElementById('player-play');
        if (playBtn) {
            playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
        const nomeEl = document.getElementById('player-musica-nome');
        if (nomeEl) nomeEl.textContent = musicas[indiceAtual].nome;
    }

    // Minimizar/Maximizar
    function toggleMinimize() {
        isMinimized = !isMinimized;
        const player = document.getElementById('player-container');
        const normal = document.getElementById('player-normal');
        const mini = document.getElementById('player-mini');
        if (isMinimized) {
            player.classList.add('minimized');
            normal.style.display = 'none';
            mini.style.display = 'flex';
        } else {
            player.classList.remove('minimized');
            normal.style.display = 'block';
            mini.style.display = 'none';
        }
    }

    // Construir o HTML do player
    function criarPlayer() {
        const container = document.createElement('div');
        container.id = 'player-container';
        container.className = 'player-container glass-card'; // glass-card é uma classe global

        // Versão normal
        const normalDiv = document.createElement('div');
        normalDiv.id = 'player-normal';
        normalDiv.innerHTML = `
            <div class="player-header">
                <span class="player-title"><i class="fas fa-music"></i> Player</span>
                <button id="player-minimize-btn" class="player-minimize"><i class="fas fa-minus"></i></button>
            </div>
            <div class="player-content">
                <div class="player-info">
                    <span id="player-musica-nome">${musicas[indiceAtual].nome}</span>
                </div>
                <div class="player-progress">
                    <input type="range" id="player-seek" value="0" step="0.1" min="0" max="100">
                </div>
                <div class="player-controls">
                    <button id="player-prev"><i class="fas fa-step-backward"></i></button>
                    <button id="player-play"><i class="fas fa-play"></i></button>
                    <button id="player-next"><i class="fas fa-step-forward"></i></button>
                    <div class="player-volume">
                        <i class="fas fa-volume-up"></i>
                        <input type="range" id="player-volume" min="0" max="1" step="0.01" value="1">
                    </div>
                </div>
            </div>
        `;

        // Versão minimizada
        const miniDiv = document.createElement('div');
        miniDiv.id = 'player-mini';
        miniDiv.style.display = 'none';
        miniDiv.innerHTML = `
            <button id="player-maximize-btn" class="player-maximize">
                <i class="fas fa-music"></i>
            </button>
        `;

        container.appendChild(normalDiv);
        container.appendChild(miniDiv);
        document.body.appendChild(container);

        // Conectar eventos
        document.getElementById('player-play').addEventListener('click', togglePlay);
        document.getElementById('player-next').addEventListener('click', proximaMusica);
        document.getElementById('player-prev').addEventListener('click', musicaAnterior);
        document.getElementById('player-minimize-btn').addEventListener('click', toggleMinimize);
        document.getElementById('player-maximize-btn').addEventListener('click', toggleMinimize);

        const seek = document.getElementById('player-seek');
        seek.addEventListener('input', function () {
            if (audio.duration) {
                audio.currentTime = (this.value / 100) * audio.duration;
            }
        });

        audio.addEventListener('timeupdate', function () {
            if (audio.duration) {
                seek.value = (audio.currentTime / audio.duration) * 100;
            }
            salvarEstado(); // salva tempo e estado periodicamente
        });

        const volume = document.getElementById('player-volume');
        volume.addEventListener('input', function () {
            audio.volume = this.value;
        });

        // Quando a música termina, avança
        audio.addEventListener('ended', proximaMusica);
    }

    // Inicialização
    carregarEstado();
    criarPlayer();
    carregarMusica(indiceAtual);
    audio.volume = document.getElementById('player-volume')?.value || 1;

    // Se estava tocando antes, tocar agora
    if (wasPlayingBeforeNav) {
        audio.play().catch(e => console.warn('Erro ao retomar reprodução:', e));
        isPlaying = true;
        atualizarInterface();
    }

    // Salvar estado antes de sair da página (para capturar tempo e índice)
    window.addEventListener('beforeunload', function () {
        salvarEstado();
    });

    // Atualização periódica (já é feita no timeupdate)
})();