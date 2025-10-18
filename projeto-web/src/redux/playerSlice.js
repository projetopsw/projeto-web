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

        // NOVO REDUCER PARA REMOVER MÚSICA DA FILA
        removeSongFromQueue: (state, action) => {
            const songIdToRemove = action.payload;

            if (!state.currentSong || state.queue.length === 0) return;

            const currentSongIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            const indexToRemove = state.queue.findIndex(s => s.id === songIdToRemove);

            // Não remove a música atual
            if (indexToRemove === -1 || songIdToRemove === state.currentSong.id) return;

            // 1. Remove da fila atual
            state.queue.splice(indexToRemove, 1);
            // 2. Remove da fila original (para manter o reordenamento correto)
            state.originalQueue = state.originalQueue.filter(s => s.id !== songIdToRemove);

            // 3. Ajusta o índice de reprodução se a música removida estava antes
            if (indexToRemove < currentSongIndex) {
                state.queueIndex -= 1;
            } else if (indexToRemove === currentSongIndex) {
                // Caso extremo, onde a música atual é removida (já bloqueado acima)
            }
        },

        togglePlayPause: (state) => {
            if (state.currentSong) {
                state.isPlaying = !state.isPlaying;
            }
        },
        
        skipNext: (state) => {
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
    removeSongFromQueue, // 👈 EXPORTADO
    togglePlayPause,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat,
    reorderQueue,
    setDuration,
    updateCurrentTime,
    setVolume,
    seekTo,
} = playerSlice.actions;

export default playerSlice.reducer;