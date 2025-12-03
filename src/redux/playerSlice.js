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

const AMBIENT_SONG = {
    id: 'ambient-default', 
    title: 'Ambient Piano',
    artist: 'Moosica',
    cover: '/assets/img/vacateste.jpg', 
    audioUrl: '/assets/audio/ambientpiano.mp3', 
    isAmbient: true, 
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
    selectedSongInfo: null, // Novo campo para guardar a info da música real selecionada
};

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        playSong: (state, action) => {
            const songToPlay = action.payload; 
            
            state.currentSong = AMBIENT_SONG;
            state.selectedSongInfo = songToPlay; 
            
            state.queue = [AMBIENT_SONG];
            state.originalQueue = [AMBIENT_SONG];
            state.queueIndex = 0;
            state.isPlaying = true;
            state.currentTime = 0;
            state.isShuffling = false; 
        },

        setQueue: (state, action) => {
            const newOriginalQueue = action.payload.songs;
            
            state.originalQueue = [AMBIENT_SONG, ...newOriginalQueue];
            
            if (state.isShuffling) {
                const songToStart = newOriginalQueue[action.payload.startIndex || 0];
                
                let remainingSongs = newOriginalQueue.filter((s, index) => index !== (action.payload.startIndex || 0));
                let shuffled = shuffleArray(remainingSongs);
                
                state.queue = [AMBIENT_SONG, songToStart, ...shuffled];
            } else {
                state.queue = state.originalQueue;
            }

            const songToStart = action.payload.songs[action.payload.startIndex || 0];
            state.selectedSongInfo = songToStart;

            // O índice 0 agora é sempre a AMBIENT_SONG
            state.queueIndex = 0; 
            
            if (state.queue.length > 0) {
                state.currentSong = state.queue[state.queueIndex]; // AMBIENT_SONG
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },
        
        toggleShuffle: (state) => {
            state.isShuffling = !state.isShuffling;

            if (state.isShuffling) {
                if (!state.currentSong) return;
                
                // Excluímos a AMBIENT_SONG da lista para embaralhar o restante
                const restOfOriginal = [...state.originalQueue].filter(s => s.id !== AMBIENT_SONG.id);
                
                let shuffledRest = shuffleArray(restOfOriginal);
                
                state.queue = [AMBIENT_SONG, ...shuffledRest];
                state.queueIndex = 0;
            } else {
                state.queue = state.originalQueue;
                state.queueIndex = 0; // Volta para AMBIENT_SONG na posição 0
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
                state.queueIndex = 0; 
                state.currentSong = AMBIENT_SONG;
                state.selectedSongInfo = song;
                state.isPlaying = true;
            }
        },

        removeSongFromQueue: (state, action) => {
            const songIdToRemove = action.payload;

            if (!state.currentSong || state.queue.length === 0) return;
            if (songIdToRemove === AMBIENT_SONG.id) return; // Não permite remover a música ambiente

            let indexToSplice = state.queue.findIndex((s, index) => 
                s.id === songIdToRemove
            );

            if (indexToSplice === -1) return;

            state.queue.splice(indexToSplice, 1);
            
            // Remove da fila original, mantendo a música ambiente
            state.originalQueue = state.originalQueue.filter(s => s.id !== songIdToRemove);

            // Se o item removido estava antes do atual (que é sempre o índice 0, a música ambiente), não precisamos fazer nada
            // O currentSong continua sendo AMBIENT_SONG no índice 0.
        },

        reorderQueue: (state, action) => {
            const { sourceIndex, destinationIndex } = action.payload;

            if (sourceIndex === 0 || destinationIndex === 0) return; // Impede mover a AMBIENT_SONG

            const [movedItem] = state.queue.splice(sourceIndex, 1);
            state.queue.splice(destinationIndex, 0, movedItem);

            state.isShuffling = false; 
            state.originalQueue = [...state.queue]; // A AMBIENT_SONG já está no começo

            state.queueIndex = 0; // Continua na AMBIENT_SONG
            state.currentSong = state.queue[state.queueIndex];
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

            // Sempre voltamos para AMBIENT_SONG após tocar
            state.queueIndex = 0; 
            state.currentSong = state.queue[0];
            state.isPlaying = true;
            state.currentTime = 0;

            // Se o objetivo é tocar a PRÓXIMA música REAL
            /*
            let nextIndex = state.queueIndex + 1;
            
            if (nextIndex < state.queue.length) {
                state.queueIndex = nextIndex;
                state.currentSong = state.queue[nextIndex];
                state.isPlaying = true;
                state.currentTime = 0;
                if (!state.currentSong.isAmbient) {
                     state.selectedSongInfo = state.currentSong;
                }
            } else if (state.repeatMode === REPEAT_MODES.QUEUE && state.queue.length > 0) {
                state.queueIndex = 0;
                state.currentSong = state.queue[0];
                state.isPlaying = true;
                state.currentTime = 0;
                state.selectedSongInfo = state.currentSong.isAmbient ? state.originalQueue[1] : state.currentSong;
            } else {
                state.isPlaying = false; 
            }
            */
        },

        skipPrevious: (state) => {
            // Em um player de música ambiente simples, skipPrevious pode apenas reiniciar
            state.queueIndex = 0;
            state.currentSong = state.queue[0];
            state.isPlaying = true;
            state.currentTime = 0;

            // Se o objetivo é tocar a ANTERIOR música REAL
            /*
            const prevIndex = state.queueIndex - 1;
            if (prevIndex >= 0) {
                state.queueIndex = prevIndex;
                state.currentSong = state.queue[prevIndex];
                state.isPlaying = true;
                state.currentTime = 0;
                if (!state.currentSong.isAmbient) {
                     state.selectedSongInfo = state.currentSong;
                }
            }
            */
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