import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import axios from 'axios';

const LIKED_SONGS_ID = "0";

const loadUserFromLocalStorage = () => {
    try {
        const serializedUser = localStorage.getItem('user');
        if (serializedUser === null) {
            return null;
        }
        const user = JSON.parse(serializedUser);
        if (user) {
            user.likedSongs = user.likedSongs || [];
            user.userPlaylists = user.userPlaylists || [];
        }
        return user;
    } catch (e) {
        return null;
    }
};

const initialUser = loadUserFromLocalStorage();


// ----------------------------------------------------
// THUNKS ASSÍNCRONOS (CORRIGIDAS)
// ----------------------------------------------------

export const toggleLikeSongAsync = createAsyncThunk(
    'auth/toggleLikeSong',
    // Removemos currentLikedSongs dos argumentos. A thunk buscará a lista atual.
    async ({ userId, songId }, { rejectWithValue }) => {
        
        try {
            // 1. BUSCA O ESTADO ATUAL (user.likedSongs e userPlaylists/0.songs)
            const userResponse = await api.get(`/users/${userId}`);
            const currentLikedSongs = userResponse.data.likedSongs || [];
            
            const isLiked = currentLikedSongs.includes(songId);
            
            // Determina a nova lista de likedSongs
            const newLikedSongs = isLiked
                ? currentLikedSongs.filter(id => id !== songId)
                : [...currentLikedSongs, songId];

            // 2. ATUALIZAÇÃO DO USUÁRIO (users.likedSongs)
            await api.patch(`/users/${userId}`, { likedSongs: newLikedSongs });

            // 3. ATUALIZAÇÃO DA PLAYLIST FÍSICA 'MÚSICAS CURTIDAS' (userPlaylists/0)
            await api.patch(`/userPlaylists/${LIKED_SONGS_ID}`, { songs: newLikedSongs });

            return newLikedSongs; 

        } catch (error) {
            console.error("Erro na dupla atualização de curtir:", error);
            // Retorna o erro exato da API para melhor debug
            return rejectWithValue(error.response?.data || error.message || 'Falha ao curtir/descurtir música na API.');
        }
    }
);

export const addSongToPlaylistAsync = createAsyncThunk(
    'auth/addSongToPlaylist',
    async ({ userId, playlistId, songId }, { rejectWithValue, dispatch, getState }) => {
        
        try {
            if (playlistId === LIKED_SONGS_ID) {
                
                // Se a ação é adicionar à playlist 0, chamamos a thunk principal de toggle
                // Ela fará o GET/PATCH necessário e atualizará o estado
                const result = await dispatch(toggleLikeSongAsync({ userId, songId })).unwrap();
                
                const isNowInList = result.includes(songId);
                
                if (isNowInList) {
                     return { songId, playlistId: LIKED_SONGS_ID, added: true, message: "Música curtida com sucesso!" };
                } else {
                    // Se foi removida (curtida -> descurtida) por engano, ou já existia
                    return { songId: null, playlistId: LIKED_SONGS_ID, added: false, message: "Música já curtida (ou removida inesperadamente)." };
                }


            } else {
                // Lógica para playlists personalizadas
                const playlistResponse = await api.get(`/userPlaylists/${playlistId}`);
                const currentSongs = playlistResponse.data.songs || [];

                if (!currentSongs.includes(songId)) {
                    const updatedSongs = [...currentSongs, songId];
                    await api.patch(`/userPlaylists/${playlistId}`, { songs: updatedSongs });
                    
                    return { songId, playlistId, updatedSongs, added: true, message: "Adicionada à playlist com sucesso!" };
                }
                
                return { songId: null, playlistId, added: false, message: "Música já está nesta playlist." };
            }
        } catch (error) {
            const errorMessage = error.message || 'Falha ao adicionar música à playlist.';
            return rejectWithValue(errorMessage);
        }
    }
);

// O restante das thunks e do slice permanece inalterado.
export const fetchUserPlaylistsDetail = createAsyncThunk(
    'auth/fetchUserPlaylistsDetail',
    async (userId, { rejectWithValue }) => {
        try {
            const userResponse = await api.get(`/users/${userId}`);
            const userPlaylistsIds = userResponse.data.userPlaylists || []; 
            
            const promises = userPlaylistsIds.map(id => api.get(`/userPlaylists/${id}`));
            const responses = await Promise.all(promises);

            return responses.map(response => response.data);
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Falha ao buscar detalhes das playlists.');
        }
    }
);

export const toggleFollowArtistAsync = createAsyncThunk(
    'auth/toggleFollowArtist',
    async ({ userId, artistId, currentFollowing }, { rejectWithValue }) => {
        const isFollowing = currentFollowing.includes(artistId);
        
        const newFollowing = isFollowing
            ? currentFollowing.filter(id => id !== artistId)
            : [...currentFollowing, artistId]; 

        try {
            await api.patch(`/users/${userId}`, { following: newFollowing });
            return newFollowing;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Falha ao seguir/deixar de seguir artista.');
        }
    }
);


export const fetchUsersByIds = createAsyncThunk(
    'auth/fetchUsersByIds',
    async (ids, { rejectWithValue }) => {
        try {
            const userPromises = ids.map(id =>
                axios.get(`http://localhost:3001/users/${id}`)
            );

            const responses = await Promise.all(userPromises);

            const users = responses.map(response => response.data);
            
            return users;

        } catch (error) {
            return rejectWithValue('Falha ao buscar os detalhes dos amigos.');
        }
    }
);


const initialState = {
    user: initialUser,
    isAuthenticated: !!initialUser, 
    token: localStorage.getItem('token') || null,
    userPlaylistsDetail: [], 
    playlistsStatus: 'idle',
    friends: {
        items: [],
        status: 'idle',
        error: null,
    },
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;

            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('token', action.payload.token);
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.userPlaylistsDetail = [];
            
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
    },
    extraReducers: (builder) => {
        builder
            // ************ HANDLER CORAÇÃO/MÚSICAS CURTIDAS ************
            // toggleLikeSongAsync: Atualiza user.likedSongs no estado local
            .addCase(toggleLikeSongAsync.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.likedSongs = action.payload;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
                // Tenta atualizar userPlaylistsDetail se a lista já estiver carregada
                const likedPlaylist = state.userPlaylistsDetail.find(p => p.id === LIKED_SONGS_ID);
                if (likedPlaylist) {
                     likedPlaylist.songs = action.payload;
                }
            })
            // ************ HANDLER PARA PLAYLISTS PERSONALIZADAS ************
            .addCase(addSongToPlaylistAsync.fulfilled, (state, action) => {
                const { songId, playlistId, added, updatedSongs } = action.payload;
                
                // Atualiza playlists PERSONALIZADAS (Id != 0) no Redux
                if (added && songId && playlistId !== LIKED_SONGS_ID) {
                    const playlist = state.userPlaylistsDetail.find(p => p.id === playlistId);
                    if (playlist) {
                        playlist.songs = updatedSongs;
                    }
                }
            })
            // ************ OUTROS HANDLERS ************
            .addCase(toggleFollowArtistAsync.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.following = action.payload;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            })
            .addCase(fetchUserPlaylistsDetail.pending, (state) => {
                state.playlistsStatus = 'loading';
            })
            .addCase(fetchUserPlaylistsDetail.fulfilled, (state, action) => {
                state.userPlaylistsDetail = action.payload;
                state.playlistsStatus = 'succeeded';
            })
            .addCase(fetchUserPlaylistsDetail.rejected, (state) => {
                state.playlistsStatus = 'failed';
                state.userPlaylistsDetail = [];
            })
            .addCase(fetchUsersByIds.pending, (state) => {
                state.friends.status = 'loading';
            })
            .addCase(fetchUsersByIds.fulfilled, (state, action) => {
                state.friends.status = 'succeeded';
                state.friends.items = action.payload;
            })
            .addCase(fetchUsersByIds.rejected, (state, action) => {
                state.friends.status = 'failed';
                state.friends.error = action.error.message;
            });
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;