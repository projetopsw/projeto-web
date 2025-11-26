import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import mongoApi from '../services/mongoApi';
import { setUserData } from './userSlice'; 

const LIKED_SONGS_ID = "0";
const API_URL = 'http://127.0.0.1:3000';

const loadAuthDataFromLocalStorage = () => {
    try {
        const token = localStorage.getItem('token');
        return { isAuthenticated: !!token, token: token || null };
    } catch (e) {
        return { isAuthenticated: false, token: null };
    }
};

const initialAuth = loadAuthDataFromLocalStorage();

export const loginUserAsync = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue, dispatch }) => {
        try {
            const response = await mongoApi.post('/users/login', { email, password });
            
            // CORREÇÃO: O token é necessário no userSlice para futuras requisições (ProfileEdition)
            const { user, token } = response.data;
            const userWithToken = { ...user, role: user.role || 'user', token: token }; 
            
            // Dispatch para userSlice para salvar os dados do usuário E o token
            dispatch(setUserData(userWithToken)); 
            localStorage.setItem('token', token); 
            
            // Retorna o token para o extraReducer deste slice, que atualizará isAuthenticated/token.
            return { token }; 
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erro ao fazer login');
        }
    }
);

export const handleSpotifyCallback = createAsyncThunk(
    'auth/spotifyCallback',
    async (_, { rejectWithValue, dispatch }) => {
        const urlParams = new URLSearchParams(window.location.search);
        const moosicaToken = urlParams.get('token');

        if (!moosicaToken) {
            return rejectWithValue('Token não encontrado na URL.');
        }

        try {
            localStorage.setItem('token', moosicaToken);
            
            const response = await mongoApi.get('/users/me', {
                baseURL: API_URL,
                headers: {
                    Authorization: `Bearer ${moosicaToken}`,
                },
            });

            window.history.replaceState({}, document.title, window.location.pathname);

            const user = response.data;
            // CORREÇÃO: Adiciona o token no objeto do usuário antes de enviar para o userSlice
            const userWithToken = { ...user, role: user.role || 'user', token: moosicaToken }; 
            
            dispatch(setUserData(userWithToken));
            
            return { token: moosicaToken };

        } catch (error) {
            localStorage.removeItem('token');
            return rejectWithValue('Falha ao validar token Moosica.');
        }
    }
);

export const toggleLikeSongAsync = createAsyncThunk(
    'auth/toggleLikeSong',
    async ({ userId, songId }, { rejectWithValue }) => {
        try {
            const userResponse = await api.get(`/users/${userId}`);
            const currentLikedSongs = userResponse.data.likedSongs || [];
            
            const isLiked = currentLikedSongs.includes(songId);
    
            const newLikedSongs = isLiked
                ? currentLikedSongs.filter(id => id !== songId)
                : [...currentLikedSongs, songId];

            await api.patch(`/users/${userId}`, { likedSongs: newLikedSongs });

            return newLikedSongs; 

        } catch (error) {
            return rejectWithValue(error.response?.data || 'Falha ao curtir música.');
        }
    }
);

export const addSongToPlaylistAsync = createAsyncThunk(
    'auth/addSongToPlaylist',
    async ({ userId, playlistId, songId }, { rejectWithValue, dispatch }) => {
        try {
            if (playlistId === LIKED_SONGS_ID) {
                const result = await dispatch(toggleLikeSongAsync({ userId, songId })).unwrap();
                const isNowInList = result.includes(songId);
                
                return { 
                    songId, 
                    playlistId: LIKED_SONGS_ID, 
                    added: isNowInList, 
                    message: isNowInList ? "Música curtida com sucesso!" : "Música descurtida." 
                };
            } 
            else {
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
            return rejectWithValue(error.message || 'Falha ao adicionar música à playlist.');
        }
    }
);

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
            return rejectWithValue(error.response?.data || 'Falha ao seguir artista.');
        }
    }
);

export const fetchUsersByIds = createAsyncThunk(
    'auth/fetchUsersByIds',
    async (ids, { rejectWithValue }) => {
        try {
            const userPromises = ids.map(id => api.get(`/users/${id}`));
            const responses = await Promise.all(userPromises);
            return responses.map(response => response.data);
        } catch (error) {
            return rejectWithValue('Falha ao buscar os detalhes dos amigos.');
        }
    }
);

const initialState = {
    isAuthenticated: initialAuth.isAuthenticated, 
    token: initialAuth.token,
    isAdmin: false, 
    userPlaylistsDetail: [], 
    playlistsStatus: 'idle',
    friends: {
        items: [],
        status: 'idle',
        error: null,
    },
    loginError: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.isAuthenticated = false;
            state.token = null;
            state.userPlaylistsDetail = [];
            state.isAdmin = false;
            localStorage.removeItem('token');
            // CORREÇÃO: Remove o token do localStorage
        },
        setTestUser: (state, action) => {
            state.isAuthenticated = true;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUserAsync.fulfilled, (state, action) => {
                const { token } = action.payload;
                
                state.isAuthenticated = true;
                state.token = token;
                state.loginError = null;
                // Já está no loginUserAsync, mas manter aqui não é errado.
                localStorage.setItem('token', token); 
            })
            .addCase(loginUserAsync.rejected, (state, action) => {
                state.loginError = action.payload;
                state.isAuthenticated = false;
                state.token = null; // Garante que o token é limpo
                localStorage.removeItem('token'); // Garante que o localStorage é limpo
            })

            .addCase(handleSpotifyCallback.fulfilled, (state, action) => {
                const { token } = action.payload;
                
                state.isAuthenticated = true;
                state.token = token;
                state.loginError = null;
            })
            .addCase(handleSpotifyCallback.rejected, (state, action) => {
                state.loginError = action.payload;
                state.isAuthenticated = false;
                state.token = null; // Garante que o token é limpo
            })
            
            .addCase(addSongToPlaylistAsync.fulfilled, (state, action) => {
                const { songId, playlistId, added, updatedSongs } = action.payload;
                if (added && songId && playlistId !== LIKED_SONGS_ID) {
                    const playlist = state.userPlaylistsDetail.find(p => p.id === playlistId);
                    if (playlist) {
                        playlist.songs = updatedSongs;
                    }
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

export const { logout, setTestUser } = authSlice.actions; 
export default authSlice.reducer;