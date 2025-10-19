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
                const songToStart = newOriginalQueue[action.payload.startIndex || 0];
                
                // Monta a fila embaralhada a partir da nova originalQueue
                let remainingSongs = newOriginalQueue.filter((s, index) => index !== (action.payload.startIndex || 0));
                let shuffled = shuffleArray(remainingSongs);
                
                state.queue = [songToStart, ...shuffled];
            } else {
                state.queue = newOriginalQueue;
            }

            // O startIndex indica qual música deve ser a primeira a tocar
            const songToStart = action.payload.songs[action.payload.startIndex || 0];
            
            // Encontra a primeira ocorrência para definir o índice
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
                
                // A lógica de shuffle agora deve lidar com IDs repetidos.
                // Simplesmente remove a música atual da lista e embaralha o resto.
                
                // Encontra a posição atual na originalQueue
                const currentSongId = state.currentSong.id;
                const currentIndexInOriginal = state.originalQueue.findIndex(s => s.id === currentSongId);
                
                if (currentIndexInOriginal === -1) return; // Não deveria acontecer

                // 1. Pega a música atual
                const currentSong = state.currentSong;
                
                // 2. Cria uma lista de "resto" da fila, removendo a *instância* atual
                const restOfOriginal = [...state.originalQueue];
                restOfOriginal.splice(currentIndexInOriginal, 1);
                
                // 3. Embaralha o resto
                let shuffledRest = shuffleArray(restOfOriginal);
                
                // 4. Monta a nova fila embaralhada
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

        // 💡 REDUCER MODIFICADO: PERMITE ADICIONAR MÚSICAS DUPLICADAS NA FILA
        addSingleSongToQueue: (state, action) => {
            const song = action.payload;
            
            // 1. Sempre adiciona à fila ORIGINAL
            state.originalQueue.push(song);
            
            // 2. Adiciona à QUEUE, respeitando o modo Shuffle/Normal
            if (state.isShuffling) {
                // Se estiver em modo Shuffle, a nova música vai para o fim da QUEUE atual
                state.queue.push(song);
            } else {
                // Se não estiver em modo Shuffle, atualiza a QUEUE com o ORIGINAL (mantendo a ordem)
                state.queue = state.originalQueue;
            }

            // 3. Se não houver música tocando, esta se torna a música atual
            if (!state.currentSong) {
                // O queueIndex aponta para a música recém-adicionada (última da fila)
                state.queueIndex = state.queue.length - 1;
                state.currentSong = song;
                state.isPlaying = true;
            }
        },

        // 💡 REDUCER MODIFICADO: removeSongFromQueue
        removeSongFromQueue: (state, action) => {
            const songIdToRemove = action.payload;

            // Bloqueia a remoção se a fila estiver vazia ou se não houver currentSong
            if (!state.currentSong || state.queue.length === 0) return;

            // 1. Identificar as instâncias a serem removidas. 
            // Como a remoção é feita pelo GrupoDetalhe (fila de espera), 
            // queremos remover apenas as músicas *não-atuais* que têm esse ID.

            // Encontra a PRIMEIRA ocorrência na fila *depois* do currentSong.
            // O indexToSplice será relativo ao array QUEUE.
            let indexToSplice = state.queue.findIndex((s, index) => 
                s.id === songIdToRemove && index !== state.queueIndex
            );

            // Se não encontrou nenhuma instância não-atual, não remove
            if (indexToSplice === -1) {
                // Se for a música atual, bloqueia a remoção
                if (songIdToRemove === state.currentSong.id) return;
                // Caso contrário, a música simplesmente não está na fila/não é a próxima instância
                return;
            }

            // 2. Remove da fila atual (Queue)
            state.queue.splice(indexToSplice, 1);
            
            // 3. Remove da fila original (OriginalQueue)
            // Para garantir que a originalQueue reflita a mudança, precisamos remover
            // a instância correspondente. Isso é complexo com duplicatas.
            // A solução mais simples é RECONSTRUIR a OriginalQueue a partir da Queue 
            // e do estado atual (isso pressupõe que a fila atual é sempre a verdade).
            state.originalQueue = [...state.queue];


            // 4. Ajusta o queueIndex: se a música removida estava antes da música atual
            if (indexToSplice < state.queueIndex) {
                state.queueIndex -= 1;
            } else if (indexToSplice === state.queueIndex) {
                 // A música atual só é removida se ela for a única com aquele ID na fila,
                 // o que é uma exceção. Mantemos a lógica para ajuste em caso de erro.
                state.queueIndex = Math.min(state.queueIndex, state.queue.length - 1);
                state.currentSong = state.queue[state.queueIndex] || null;
            }
            
            // A música atual sempre será state.queue[state.queueIndex].
            state.currentSong = state.queue[state.queueIndex] || null;
        },

        // 💡 REDUCER MODIFICADO: reorderQueue
        reorderQueue: (state, action) => {
            const { sourceIndex, destinationIndex } = action.payload;
            
            // 1. Aplica o reordenamento na QUEUE atual (a fila que está sendo exibida e tocada)
            const [movedItem] = state.queue.splice(sourceIndex, 1);
            state.queue.splice(destinationIndex, 0, movedItem);

            // 2. O reordenamento manual DESLIGA o Shuffle e torna a fila atual a nova fila original.
            state.isShuffling = false; 
            // Com duplicatas, a fila atual (queue) é a nova "original"
            state.originalQueue = [...state.queue];
            
            // 3. Reajusta o índice da música atual
            state.queueIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            // Se a música atual não estiver mais na fila, a próxima música deve ser a primeira.
            if(state.queueIndex === -1 && state.queue.length > 0) state.queueIndex = 0;
            if(state.queueIndex !== -1) {
                 state.currentSong = state.queue[state.queueIndex];
            } else {
                 state.currentSong = null;
                 state.isPlaying = false;
            }
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