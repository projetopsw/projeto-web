import { createSlice } from '@reduxjs/toolkit';


const generateQueueId = () => {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const getArtistName = (song) => {
    if (song.artists && Array.isArray(song.artists) && song.artists.length > 0) {
        return song.artists[0].name || song.artists[0].username || 'Artista Desconhecido';
    }
    if (typeof song.artist === 'string' && song.artist.trim() !== '') {
        return song.artist;
    }
    if (song.artist && typeof song.artist === 'object') {
        return song.artist.name || song.artist.username || 'Artista Desconhecido';
    }
    return 'Artista Desconhecido';
};

const getAlbumTitle = (song) => {
    if (typeof song.album === 'string') return song.album;
    if (song.album && typeof song.album === 'object') {
        return song.album.name || song.album.title || '';
    }
    return '';
};

const REPEAT_MODES = { OFF: 0, QUEUE: 1, SONG: 2 };
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

const LOCAL_STORAGE_KEY_PLAYER = 'playerState';

const loadPlayerState = () => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY_PLAYER);
        if (!serializedState || serializedState === 'undefined') return undefined;
        
        const state = JSON.parse(serializedState);
        
        if (state) {
            const ensureQueueIds = (list) => list?.map(s => ({ ...s, queueId: s.queueId || generateQueueId() })) || [];
            
            state.queue = ensureQueueIds(state.queue);
            state.originalQueue = ensureQueueIds(state.originalQueue);

            if (state.currentSong && !state.currentSong.queueId) {
                const match = state.queue.find(s => s._id === state.currentSong._id);
                state.currentSong.queueId = match ? match.queueId : generateQueueId();
            }

            return {
                ...state,
                isPlaying: false,
                queue: state.queue,
                originalQueue: state.originalQueue
            };
        }
        return undefined;
    } catch (e) {
        return undefined;
    }
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
    ...loadPlayerState(),
};

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        playSong: (state, action) => {
            const songToPlay = action.payload;
            const isApiOrArtist = songToPlay.isArtistUpload === true || !songToPlay.caminho; 
            
            let baseSong = songToPlay;
            if (isApiOrArtist) {
                baseSong = {
                    ...AMBIENT_SONG,
                    _id: songToPlay._id,
                    title: songToPlay.title,
                    cover: songToPlay.cover,
                    caminho: songToPlay.caminho || AMBIENT_SONG.caminho
                };
            }

            const finalSong = { 
                ...baseSong, 
                artist: getArtistName(songToPlay),
                album: getAlbumTitle(songToPlay),
                queueId: generateQueueId() 
            };

            state.currentSong = finalSong;
            state.selectedSongInfo = songToPlay;

            state.queue = [finalSong];
            state.originalQueue = [finalSong];
            state.queueIndex = 0;
            state.isPlaying = true;
            state.currentTime = 0;
            state.isShuffling = false; 
        },

        playFromQueue: (state, action) => {
            const queueIdToPlay = action.payload;
            const index = state.queue.findIndex(s => s.queueId === queueIdToPlay);
        
            if (index !== -1) {
                state.queueIndex = index;
                state.currentSong = state.queue[index];
                state.selectedSongInfo = state.queue[index];
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },

        setQueue: (state, action) => {
            const songsPayload = action.payload.songs;
            const startIndex = action.payload.startIndex || 0;
            
            if (!songsPayload || songsPayload.length === 0) return;

            const processedQueue = songsPayload.map(song => {
                const isApiOrArtist = song.isArtistUpload === true || !song.caminho;
                let processedSong = song;

                if (isApiOrArtist) {
                    processedSong = {
                        ...AMBIENT_SONG,
                        _id: song._id,
                        title: song.title,
                        cover: song.cover,
                        caminho: song.caminho || AMBIENT_SONG.caminho
                    };
                }
                
                return { 
                    ...processedSong, 
                    artist: getArtistName(song),
                    album: getAlbumTitle(song),
                    queueId: generateQueueId() 
                };
            });
            
            state.originalQueue = processedQueue;
            
            const songToStart = processedQueue[startIndex];
            
            if (state.isShuffling) {
                let remainingSongs = processedQueue.filter((s) => s.queueId !== songToStart.queueId);
                let shuffled = shuffleArray(remainingSongs);
                state.queue = [songToStart, ...shuffled];
            } else {
                state.queue = state.originalQueue;
            }

            state.queueIndex = state.queue.findIndex(s => s.queueId === songToStart.queueId); 
            state.currentSong = state.queue[state.queueIndex]; 
            state.selectedSongInfo = songsPayload.find(s => s._id === songToStart._id) || songToStart;

            if (state.queue.length > 0) {
                state.isPlaying = true;
                state.currentTime = 0;
            }
        },
        
        addSingleSongToQueue: (state, action) => {
            const song = action.payload;
            const isApiOrArtist = song.isArtistUpload === true || !song.caminho;
            
            let processedSong = song;
            if (isApiOrArtist) {
                processedSong = {
                    ...AMBIENT_SONG,
                    _id: song._id,
                    title: song.title,
                    cover: song.cover,
                    caminho: song.caminho || AMBIENT_SONG.caminho
                };
            }
            
            const finalSong = { 
                ...processedSong, 
                artist: getArtistName(song),
                album: getAlbumTitle(song),
                queueId: generateQueueId() 
            };
            
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

        toggleShuffle: (state) => {
            state.isShuffling = !state.isShuffling;
            if (state.isShuffling) {
                if (!state.currentSong) return;
                const currentQueueId = state.currentSong.queueId;
                const restOfOriginal = state.originalQueue.filter(s => s.queueId !== currentQueueId);
                let shuffledRest = shuffleArray(restOfOriginal);
                state.queue = [state.currentSong, ...shuffledRest];
                state.queueIndex = 0;
            } else {
                const currentIndex = state.originalQueue.findIndex(s => s.queueId === state.currentSong.queueId);
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

        toggleRepeat: (state) => { state.repeatMode = (state.repeatMode + 1) % 3; },
        removeSongFromQueue: (state, action) => {
            const queueIdToRemove = action.payload;
            if (!state.currentSong || state.queue.length === 0) return;
            let indexToRemoveFromQueue = state.queue.findIndex(s => s.queueId === queueIdToRemove);
            if (indexToRemoveFromQueue !== -1) {
                state.queue.splice(indexToRemoveFromQueue, 1);
            }
            state.originalQueue = state.originalQueue.filter(s => s.queueId !== queueIdToRemove);
            if (state.currentSong.queueId === queueIdToRemove) {
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
            state.queueIndex = state.queue.findIndex(s => s.queueId === state.currentSong?.queueId);
            if (state.queueIndex === -1) state.queueIndex = 0; 
        },
        togglePlayPause: (state) => { if (state.currentSong) state.isPlaying = !state.isPlaying; },
        setDuration: (state, action) => { state.duration = action.payload; },
        updateCurrentTime: (state, action) => { state.currentTime = action.payload; },
        seekTo: (state, action) => { state.currentTime = action.payload; },
        setVolume: (state, action) => { state.volume = action.payload; },
    },
});

export const {
    playSong, playFromQueue, setQueue, addSingleSongToQueue, removeSongFromQueue, reorderQueue, togglePlayPause, skipNext, skipPrevious, toggleShuffle, toggleRepeat, setDuration, updateCurrentTime, setVolume, seekTo,
} = playerSlice.actions;

export default playerSlice.reducer;