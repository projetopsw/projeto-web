import { createSlice } from '@reduxjs/toolkit';

const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const REPEAT_MODES = {
    OFF: 0,
    QUEUE: 1,
    SONG: 2,
};

const initialState = {
    currentSong: null, 
    queue: [], 
    originalQueue: [], 
    queueIndex: -1, 
    isPlaying: false, 
    volume: 0.5, 
    duration: 0, 
    currentTime: 0, 
    isShuffling: false,
    repeatMode: REPEAT_MODES.OFF,
};

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        playSong: (state, action) => {
            state.currentSong = action.payload;
            state.queue = [action.payload];
            state.originalQueue = [action.payload];
            state.queueIndex = 0;
            state.isPlaying = true;
            state.currentTime = 0;
            // Desliga o Shuffle quando um novo item é tocado (Comportamento Comum)
            state.isShuffling = false; 
        },

        setQueue: (state, action) => {
            const newOriginalQueue = action.payload.songs;
            state.originalQueue = newOriginalQueue;
            
            if (state.isShuffling) {
                const currentSong = newOriginalQueue[action.payload.startIndex || 0];
                let shuffled = shuffleArray(newOriginalQueue.filter(s => s.id !== currentSong.id));
                state.queue = [currentSong, ...shuffled];
            } else {
                state.queue = newOriginalQueue;
            }

            // O startIndex indica qual música deve ser a primeira a tocar
            const songToStart = action.payload.songs[action.payload.startIndex || 0];
            state.queueIndex = state.queue.findIndex(s => s.id === songToStart.id);
            if(state.queueIndex === -1 && state.queue.length > 0) state.queueIndex = 0;
            
            if (state.queue.length > 0) {
                state.currentSong = state.queue[state.queueIndex];
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },
        
        toggleShuffle: (state) => {
            state.isShuffling = !state.isShuffling;

            if (state.isShuffling) {
                if (!state.currentSong) return;
                
                // 1. Pega a música atual da fila original
                const currentSong = state.currentSong;
                // 2. Embaralha o resto da fila original
                let shuffledRest = shuffleArray(state.originalQueue.filter(s => s.id !== currentSong.id));
                // 3. Monta a nova fila embaralhada com a música atual na frente
                state.queue = [currentSong, ...shuffledRest];
                state.queueIndex = 0; // A música atual é sempre a primeira da fila embaralhada
            } else {
                // Volta para a fila original (ordenada)
                state.queue = state.originalQueue;
                // Encontra a posição da música atual na fila original
                state.queueIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            }
        },
        
        toggleRepeat: (state) => {
            state.repeatMode = (state.repeatMode + 1) % 3; 
        },

        // 💡 REDUCER PARA ADICIONAR UMA MÚSICA (USADO NO GrupoDetalhe)
        addSingleSongToQueue: (state, action) => {
            const song = action.payload;
            
            // Adiciona sempre na fila ORIGINAL (para o modo não-shuffle)
            // Verifica se a música já existe na fila original antes de adicionar
            if (!state.originalQueue.find(s => s.id === song.id)) {
                state.originalQueue.push(song);
            }
            
            // Se estiver em modo Shuffle, a nova música vai para o fim da QUEUE atual
            if (state.isShuffling) {
                state.queue.push(song);
            } else {
                // Se não estiver em modo Shuffle, atualiza a QUEUE com o ORIGINAL (mantendo a ordem)
                state.queue = state.originalQueue;
            }

            // Se não houver música tocando, esta se torna a música atual
            if (!state.currentSong) {
                // O queueIndex aponta para a música recém-adicionada (última da fila)
                state.queueIndex = state.queue.length - 1;
                state.currentSong = song;
                state.isPlaying = true;
            }
        },

        // 💡 REDUCER PARA REMOVER UMA MÚSICA DA FILA (USADO NO GrupoDetalhe)
        removeSongFromQueue: (state, action) => {
            const songIdToRemove = action.payload;

            // Bloqueia a remoção se a fila estiver vazia ou se não houver currentSong
            if (!state.currentSong || state.queue.length === 0) return;

            // 1. NÃO PERMITE REMOVER A MÚSICA ATUALMENTE TOCANDO
            if (songIdToRemove === state.currentSong.id) {
                // Você pode adicionar uma notificação de erro aqui se quiser
                return; 
            }
            
            // Encontra o índice da música a ser removida na queue atual
            const indexToRemove = state.queue.findIndex(s => s.id === songIdToRemove);
            if (indexToRemove === -1) return; // Música não está na fila

            // 2. Remove da fila atual (Queue)
            state.queue.splice(indexToRemove, 1);
            
            // 3. Remove da fila original (OriginalQueue)
            state.originalQueue = state.originalQueue.filter(s => s.id !== songIdToRemove);

            // 4. Ajusta o queueIndex: se a música removida estava antes da música atual
            if (indexToRemove < state.queueIndex) {
                state.queueIndex -= 1;
            } else if (indexToRemove === state.queueIndex) {
                 // Esta condição deve ser rara devido à verificação do passo 1, 
                 // mas garante que o player aponte para o próximo item
                state.queueIndex = Math.min(state.queueIndex, state.queue.length - 1);
                state.currentSong = state.queue[state.queueIndex] || null;
            }
        },

        // 💡 REDUCER PARA REORDENAR A FILA (USADO NO GrupoDetalhe DND)
        reorderQueue: (state, action) => {
            const { sourceIndex, destinationIndex } = action.payload;
            
            // 1. Aplica o reordenamento na QUEUE atual (a fila que está sendo exibida e tocada)
            const [movedItem] = state.queue.splice(sourceIndex, 1);
            state.queue.splice(destinationIndex, 0, movedItem);

            // 2. O reordenamento manual DESLIGA o Shuffle e torna a fila atual a nova fila original.
            state.isShuffling = false; 
            state.originalQueue = state.queue;
            
            // 3. Reajusta o índice da música atual (se a música atual mudou de posição)
            state.queueIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            // Se a música atual não estiver mais na fila (por algum motivo, embora não devesse), 
            // a próxima música deve ser a primeira.
            if(state.queueIndex === -1 && state.queue.length > 0) state.queueIndex = 0;
        },
        
        // --- Reducers de controle do Player (Mantidos) ---
        togglePlayPause: (state) => {
            if (state.currentSong) {
                state.isPlaying = !state.isPlaying;
            }
        },
        
        skipNext: (state) => {
            // ... (lógica skipNext) ...
            if (state.repeatMode === REPEAT_MODES.SONG) {
                state.isPlaying = true;
                state.currentTime = 0; 
                return;
            }

            let nextIndex = state.queueIndex + 1;
            
            if (nextIndex < state.queue.length) {
                state.queueIndex = nextIndex;
                state.currentSong = state.queue[nextIndex];
                state.isPlaying = true;
                state.currentTime = 0;
            } else if (state.repeatMode === REPEAT_MODES.QUEUE && state.queue.length > 0) {
                state.queueIndex = 0;
                state.currentSong = state.queue[0];
                state.isPlaying = true;
                state.currentTime = 0;
            } else {
                state.isPlaying = false; 
            }
        },

        skipPrevious: (state) => {
            const prevIndex = state.queueIndex - 1;
            if (prevIndex >= 0) {
                state.queueIndex = prevIndex;
                state.currentSong = state.queue[prevIndex];
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },
        
        setDuration: (state, action) => {
            state.duration = action.payload;
        },
        updateCurrentTime: (state, action) => {
            state.currentTime = action.payload;
        },
        seekTo: (state, action) => {
            state.currentTime = action.payload;
        },
        setVolume: (state, action) => {
            state.volume = action.payload;
        },
    },
});

export const {
    playSong,
    setQueue, 
    // 💡 Ações que o GrupoDetalhe precisa
    addSingleSongToQueue,
    removeSongFromQueue,
    reorderQueue,
    
    // ...outras ações
    togglePlayPause,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat,
    setDuration,
    updateCurrentTime,
    setVolume,
    seekTo,
} = playerSlice.actions;

export default playerSlice.reducer;