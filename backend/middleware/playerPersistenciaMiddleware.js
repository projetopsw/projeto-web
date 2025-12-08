const LOCAL_STORAGE_KEY_PLAYER = 'playerState';

const savePlayerState = (state) => {
    try {
        const stateToPersist = {
            currentSong: state.currentSong,
            queue: state.queue,
            originalQueue: state.originalQueue,
            queueIndex: state.queueIndex,
            isPlaying: state.isPlaying,
            volume: state.volume,
            currentTime: state.currentTime, 
            isShuffling: state.isShuffling,
            repeatMode: state.repeatMode,
        };
        const serializedState = JSON.stringify(stateToPersist);
        localStorage.setItem(LOCAL_STORAGE_KEY_PLAYER, serializedState);
    } catch (e) {
    }
};

export const playerPersistenceMiddleware = store => next => action => {
    const result = next(action);
    
    const playerState = store.getState().player; 
    savePlayerState(playerState);

    return result;
};