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

// 🛑 CORREÇÃO: Usar a URL completa do backend para evitar erros de domínio/porta
// Se sua porta do backend for diferente de 3000, altere este valor.
const BACKEND_BASE_URL = 'http://localhost:3000'; 

const AMBIENT_SONG = {
    _id: 'ambient-default-mock-id', 
    title: 'Ambient Piano',
    artist: 'Moosica',
    cover: '/assets/img/vacateste.jpg', 
    caminho: `${BACKEND_BASE_URL}/mock/ambientpiano.mp3`, 
    isAmbient: true, 
    isArtistUpload: true,
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
    selectedSongInfo: null, 
};

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        playSong: (state, action) => {
            const songToPlay = action.payload;
            
            // ⭐️ CORREÇÃO DEFINITIVA: Usa !songToPlay.caminho para cobrir "", null e undefined.
            const isApiOrArtist = songToPlay.isArtistUpload === true || !songToPlay.caminho; 
            
            const mockSongWithRealInfo = {
                ...AMBIENT_SONG,
                _id: songToPlay._id,
                title: songToPlay.title,
                cover: songToPlay.cover,
                // Garantir que a propriedade 'artist' seja definida corretamente para o mock
                artist: (songToPlay.artists && songToPlay.artists[0] ? songToPlay.artists[0].name || songToPlay.artists[0].username : 'Artista Desconhecido'),
            };

            const finalSong = isApiOrArtist ? mockSongWithRealInfo : songToPlay;

            state.currentSong = finalSong;
            state.selectedSongInfo = songToPlay;

            state.queue = [finalSong];
            state.originalQueue = [finalSong];
            state.queueIndex = 0;
            state.isPlaying = true;
            state.currentTime = 0;
            state.isShuffling = false; 
        },

        setQueue: (state, action) => {
            const songsPayload = action.payload.songs;
            const startIndex = action.payload.startIndex || 0;
            
            if (songsPayload.length === 0) return;

            const processedQueue = songsPayload.map(song => {
                // ⭐️ CORREÇÃO DEFINITIVA
                const isApiOrArtist = song.isArtistUpload === true || !song.caminho;
                
                if (isApiOrArtist) {
                    return {
                        ...AMBIENT_SONG,
                        _id: song._id,
                        title: song.title,
                        cover: song.cover,
                        artist: (song.artists && song.artists[0] ? song.artists[0].name || song.artists[0].username : 'Artista Desconhecido'),
                    };
                }
                return song;
            });
            
            state.originalQueue = processedQueue;
            
            const songToStart = processedQueue[startIndex];
            
            if (state.isShuffling) {
                let remainingSongs = processedQueue.filter((s, index) => index !== startIndex);
                let shuffled = shuffleArray(remainingSongs);
                state.queue = [songToStart, ...shuffled];
            } else {
                state.queue = state.originalQueue;
            }

            state.queueIndex = state.queue.findIndex(s => s._id === songToStart._id); 
            state.currentSong = songToStart; 
            
            state.selectedSongInfo = songsPayload.find(s => s._id === songToStart._id) || songToStart;

            if (state.queue.length > 0) {
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },
        
        toggleShuffle: (state) => {
            state.isShuffling = !state.isShuffling;

            if (state.isShuffling) {
                if (!state.currentSong) return;
                
                const currentSongId = state.currentSong._id;
                const restOfOriginal = state.originalQueue.filter(s => s._id !== currentSongId);
                
                let shuffledRest = shuffleArray(restOfOriginal);
                
                state.queue = [state.currentSong, ...shuffledRest];
                state.queueIndex = 0;
            } else {
                const currentIndex = state.originalQueue.findIndex(s => s._id === state.currentSong._id);
                state.queue = state.originalQueue;
                state.queueIndex = currentIndex !== -1 ? currentIndex : 0;
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
                
                state.selectedSongInfo = state.currentSong;
            } else if (state.repeatMode === REPEAT_MODES.QUEUE && state.queue.length > 0) {
                state.queueIndex = 0;
                state.currentSong = state.queue[0];
                state.isPlaying = true;
                state.currentTime = 0;
                
                state.selectedSongInfo = state.currentSong;
            } else {
                state.isPlaying = false; 
                state.currentSong = null;
                state.queueIndex = -1;
                state.selectedSongInfo = null;
            }
        },

        skipPrevious: (state) => {
            const prevIndex = state.queueIndex - 1;
            
            if (prevIndex >= 0) {
                state.queueIndex = prevIndex;
                state.currentSong = state.queue[prevIndex];
                state.isPlaying = true;
                state.currentTime = 0;
                
                state.selectedSongInfo = state.currentSong;
            } else {
                state.queueIndex = 0;
                state.currentTime = 0;
            }
        },

        toggleRepeat: (state) => {
            state.repeatMode = (state.repeatMode + 1) % 3; 
        },

        addSingleSongToQueue: (state, action) => {
            const song = action.payload;
            // ⭐️ CORREÇÃO DEFINITIVA
            const isApiOrArtist = song.isArtistUpload === true || !song.caminho;
            
            const finalSong = isApiOrArtist ? {
                ...AMBIENT_SONG,
                _id: song._id,
                title: song.title,
                cover: song.cover,
                artist: (song.artists && song.artists[0] ? song.artists[0].name || song.artists[0].username : 'Artista Desconhecido'),
            } : song;
            
            state.originalQueue.push(finalSong);
            
            if (state.isShuffling) {
                state.queue.push(finalSong);
            } else {
                state.queue = state.originalQueue;
            }

            if (!state.currentSong) {
                state.queueIndex = state.queue.length - 1; 
                state.currentSong = finalSong;
                state.selectedSongInfo = song;
                state.isPlaying = true;
            }
        },

        removeSongFromQueue: (state, action) => {
            const songIdToRemove = action.payload;

            if (!state.currentSong || state.queue.length === 0) return;
            
            let indexToRemoveFromQueue = state.queue.findIndex(s => s._id === songIdToRemove);
            
            if (indexToRemoveFromQueue !== -1) {
                state.queue.splice(indexToRemoveFromQueue, 1);
            }
            
            state.originalQueue = state.originalQueue.filter(s => s._id !== songIdToRemove);

            if (state.currentSong._id === songIdToRemove) {
                state.currentSong = null;
                state.isPlaying = false;
                state.queueIndex = -1;
                state.selectedSongInfo = null;
            } else if (indexToRemoveFromQueue !== -1 && indexToRemoveFromQueue <= state.queueIndex) {
                state.queueIndex = Math.max(0, state.queueIndex - 1);
            }
        },

        reorderQueue: (state, action) => {
            const { sourceIndex, destinationIndex } = action.payload;

            if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex >= state.queue.length || destinationIndex >= state.queue.length) return;

            const [movedItem] = state.queue.splice(sourceIndex, 1);
            state.queue.splice(destinationIndex, 0, movedItem);

            state.isShuffling = false; 
            state.originalQueue = [...state.queue]; 
            
            state.queueIndex = state.queue.findIndex(s => s._id === state.currentSong._id);
            if (state.queueIndex === -1) state.queueIndex = 0; 
        },
        
        togglePlayPause: (state) => {
            if (state.currentSong) {
                state.isPlaying = !state.isPlaying;
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