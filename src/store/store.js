import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import playerReducer from '../redux/playerSlice';
import loginReducer from '../redux/loginSlice';
import catalogoReducer from '../redux/catalogoSlice';
import playlistsReducer from '../redux/playlistsSlice';
import commentsReducer from '../redux/comentarioSlice';
import votesReducer from '../redux/votesSlice';
import connectionsReducer from '../redux/connectionsSlice';
import artistInfo from '../redux/artistaInfoSlice';
import uploadReducer from '../redux/uploadSlice';
import dbUploadReducer from '../redux/dbUploadSlice';
import userReducer from '../redux/userSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['player'], 
};

const rootReducer = combineReducers({
    player: playerReducer,
    auth: loginReducer,
    catalog: catalogoReducer,
    playlists: playlistsReducer,
    connections: connectionsReducer, 
    comments: commentsReducer,
    votes: votesReducer,
    artistInfo: artistInfo,
    upload: uploadReducer,
    dbUpload: dbUploadReducer,
    user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer, 
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);