import { configureStore } from '@reduxjs/toolkit'
import playerReducer from '../redux/playerSlice'
import loginReducer from '../redux/loginSlice'
import catalogoReducer from '../redux/catalogoSlice'
import playlistsReducer from '../redux/playlistsSlice'
import userReducer from '../redux/userSlice'
import commentsReducer from '../redux/comentarioSlice'
import votesReducer from '../redux/votesSlice'
import connectionsReducer from '../redux/connectionsSlice'
import artistInfo from '../redux/artistaInfoSlice'
import grupoReducer from '../redux/grupoSlice'

export const store = configureStore({
  reducer: {
    player: playerReducer,
    auth: loginReducer,
    catalog: catalogoReducer,
    playlists: playlistsReducer,
    user: userReducer,
    connections: connectionsReducer, 
    comments: commentsReducer,
    votes: votesReducer,
    artistInfo: artistInfo,
    groups: grupoReducer,
  },
});
