import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentSong: null,    
    queue: [],           
    queueIndex: -1,      
    isPlaying: false,  
    volume: 0.5,        
    duration: 0,          
    currentTime: 0,     
};

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        playSong: (state, action) => {
            state.currentSong = action.payload;
            state.queue = [action.payload];
            state.queueIndex = 0;
            state.isPlaying = true;
            state.currentTime = 0;
        },

        /**
         * Define uma nova fila de reprodução (ex: tocar um álbum ou playlist).
         * @param { songs: Array, startIndex: Number } action.payload
         */
        setQueue: (state, action) => {
            state.queue = action.payload.songs;
            state.queueIndex = action.payload.startIndex || 0;
            
            if (state.queue.length > 0) {
                state.currentSong = state.queue[state.queueIndex];
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },
        
        addSingleSongToQueue: (state, action) => {
            const song = action.payload;
            if (!state.queue.find(s => s.id === song.id)) {
                state.queue.push(song);
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
            const nextIndex = state.queueIndex + 1;
            if (nextIndex < state.queue.length) {
                state.queueIndex = nextIndex;
                state.currentSong = state.queue[nextIndex];
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
    reorderQueue,
    setDuration,
    updateCurrentTime,
    setVolume,
    seekTo,
} = playerSlice.actions;

export default playerSlice.reducer;