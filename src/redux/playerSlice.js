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
            state.isShuffling = false; 
        },

        setQueue: (state, action) => {
            const newOriginalQueue = action.payload.songs;
            state.originalQueue = newOriginalQueue;
            
            if (state.isShuffling) {
                const songToStart = newOriginalQueue[action.payload.startIndex || 0];
                
                let remainingSongs = newOriginalQueue.filter((s, index) => index !== (action.payload.startIndex || 0));
                let shuffled = shuffleArray(remainingSongs);
                
                state.queue = [songToStart, ...shuffled];
            } else {
                state.queue = newOriginalQueue;
            }

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
                
                const currentSongId = state.currentSong.id;
                const currentIndexInOriginal = state.originalQueue.findIndex(s => s.id === currentSongId);
                
                if (currentIndexInOriginal === -1) return;

                const currentSong = state.currentSong;
                
                const restOfOriginal = [...state.originalQueue];
                restOfOriginal.splice(currentIndexInOriginal, 1);
                
                let shuffledRest = shuffleArray(restOfOriginal);
                
                state.queue = [currentSong, ...shuffledRest];
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
            
            state.originalQueue.push(song);
            
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

        removeSongFromQueue: (state, action) => {
            const songIdToRemove = action.payload;

            if (!state.currentSong || state.queue.length === 0) return;

            let indexToSplice = state.queue.findIndex((s, index) => 
                s.id === songIdToRemove && index !== state.queueIndex
            );

            if (indexToSplice === -1) {
                if (songIdToRemove === state.currentSong.id) return;
                return;
            }

            state.queue.splice(indexToSplice, 1);
            
            state.originalQueue = [...state.queue];


            if (indexToSplice < state.queueIndex) {
                state.queueIndex -= 1;
            } else if (indexToSplice === state.queueIndex) {
                state.queueIndex = Math.min(state.queueIndex, state.queue.length - 1);
                state.currentSong = state.queue[state.queueIndex] || null;
            }
            
            state.currentSong = state.queue[state.queueIndex] || null;
        },

        reorderQueue: (state, action) => {
            const { sourceIndex, destinationIndex } = action.payload;
            
            const [movedItem] = state.queue.splice(sourceIndex, 1);
            state.queue.splice(destinationIndex, 0, movedItem);

            state.isShuffling = false; 
            state.originalQueue = [...state.queue];
            
            state.queueIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
            if(state.queueIndex === -1 && state.queue.length > 0) state.queueIndex = 0;
            if(state.queueIndex !== -1) {
                 state.currentSong = state.queue[state.queueIndex];
            } else {
                 state.currentSong = null;
                 state.isPlaying = false;
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
    removeSongFromQueue,
    reorderQueue,
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