import { createSlice } from '@reduxjs/toolkit';

// Função auxiliar para embaralhar um array (Algoritmo Fisher-Yates)
const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// 0: Off, 1: Repeat Queue/Playlist, 2: Repeat Song
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
    repeatMode: REPEAT_MODES.OFF, // NOVO ESTADO
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

            state.queueIndex = state.queue.findIndex(s => s.id === (action.payload.songs[action.payload.startIndex] || {}).id);
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
                const currentSong = state.currentSong;
                let shuffled = shuffleArray(state.originalQueue.filter(s => s.id !== currentSong.id));
                state.queue = [currentSong, ...shuffled];
                state.queueIndex = 0;
            } else {
                state.queue = state.originalQueue;
                state.queueIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            }
        },
        
        // NOVO REDUCER
        toggleRepeat: (state) => {
            state.repeatMode = (state.repeatMode + 1) % 3; 
        },

        addSingleSongToQueue: (state, action) => {
            const song = action.payload;
            if (!state.originalQueue.find(s => s.id === song.id)) {
                state.originalQueue.push(song);
            }
            if (state.isShuffling) {
                state.queue.push(song);
            } else {
                 state.queue = state.originalQueue;
            }

            if (!state.currentSong) {
                 state.queueIndex = state.queue.length - 1;
                 state.currentSong = song;
                 state.isPlaying = true;
            }
        },

        togglePlayPause: (state) => {
            if (state.currentSong) {
                state.isPlaying = !state.isPlaying;
            }
        },
        
        skipNext: (state) => {
            // Lógica de Repetição (Chamada quando a música termina ou pelo botão)
            if (state.repeatMode === REPEAT_MODES.SONG) {
                state.isPlaying = true; // Reinicia a reprodução
                state.currentTime = 0; 
                return; // Não muda o índice
            }

            let nextIndex = state.queueIndex + 1;
            
            if (nextIndex < state.queue.length) {
                // A música seguinte existe na fila
                state.queueIndex = nextIndex;
                state.currentSong = state.queue[nextIndex];
                state.isPlaying = true;
                state.currentTime = 0;
            } else if (state.repeatMode === REPEAT_MODES.QUEUE && state.queue.length > 0) {
                // Fim da fila, mas Repetir Playlist/Fila está ativo
                state.queueIndex = 0; // Volta para o início da fila
                state.currentSong = state.queue[0];
                state.isPlaying = true;
                state.currentTime = 0;
            } else {
                // Fim da fila e Repetição Desligada (OFF)
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

        reorderQueue: (state, action) => {
            const { sourceIndex, destinationIndex } = action.payload;
            const [movedItem] = state.queue.splice(sourceIndex, 1);
            state.queue.splice(destinationIndex, 0, movedItem);

            state.queueIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            
            state.isShuffling = false; 
            state.originalQueue = state.queue;
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
    addSingleSongToQueue,
    togglePlayPause,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat, // EXPORTADO
    reorderQueue,
    setDuration,
    updateCurrentTime,
    setVolume,
    seekTo,
} = playerSlice.actions;

export default playerSlice.reducer;