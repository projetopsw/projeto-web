import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api'; 
import mongoApi from '../services/mongoApi';

const LIKED_SONGS_ID = "0";
const API_URL = 'http://127.0.0.1:3000'; // URL base do seu Backend Express

const loadUserFromLocalStorage = () => {
    try {
        const serializedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!serializedUser || !token) {
            return null;
        }

        const user = JSON.parse(serializedUser);
        
        if (user) {
            user.likedSongs = user.likedSongs || [];
            user.userPlaylists = user.userPlaylists || [];
            user.role = user.role || 'user'; 
        }
        return user;
    } catch (e) {
        console.error("Erro ao carregar usuário do localStorage:", e);
        return null;
    }
};

const initialUser = loadUserFromLocalStorage();

// THUNKS EXISTENTES (loginUserAsync, etc.)

export const loginUserAsync = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await mongoApi.post('/users/login', { email, password });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erro ao fazer login');
        }
    }
);

export const handleSpotifyCallback = createAsyncThunk(
    'auth/spotifyCallback',
    async (_, { rejectWithValue }) => {
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
            const userWithRole = { ...user, role: user.role || 'user' };

            localStorage.setItem('user', JSON.stringify(userWithRole));
            
            return { user: userWithRole, token: moosicaToken };

        } catch (error) {
            console.error("Erro ao processar callback do Spotify:", error.response?.data || error.message);
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
            console.error("Erro ao curtir:", error);
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
    user: initialUser,
    isAuthenticated: !!initialUser, 
    token: localStorage.getItem('token') || null,
    isAdmin: initialUser ? initialUser.role === 'admin' : false, 
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
            state.user = null;
            state.token = null;
            state.userPlaylistsDetail = [];
            state.isAdmin = false;
            
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        setTestUser: (state, action) => {
            const { id, name, role = 'user' } = action.payload; 
            const newUser = { 
                ...state.user,
                id, 
                name: name, 
                role,
                likedSongs: [], 
                following: [],
                userPlaylists: [],
            };
            
            state.user = newUser;
            state.isAuthenticated = true;
            state.isAdmin = newUser.role === 'admin';
            localStorage.setItem('user', JSON.stringify(newUser));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUserAsync.fulfilled, (state, action) => {
                const { user, token } = action.payload;
                const userWithRole = { ...user, role: user.role || 'user' };
                
                state.isAuthenticated = true;
                state.user = userWithRole;
                state.token = token;
                state.isAdmin = userWithRole.role === 'admin';
                state.loginError = null;

                localStorage.setItem('user', JSON.stringify(userWithRole));
                localStorage.setItem('token', token);
            })
            .addCase(loginUserAsync.rejected, (state, action) => {
                state.loginError = action.payload;
                state.isAuthenticated = false;
            })

            .addCase(handleSpotifyCallback.fulfilled, (state, action) => {
                const { user, token } = action.payload;
                
                state.isAuthenticated = true;
                state.user = user;
                state.token = token;
                state.isAdmin = user.role === 'admin';
                state.loginError = null;
            })
            .addCase(handleSpotifyCallback.rejected, (state, action) => {
                state.loginError = action.payload;
                state.isAuthenticated = false;
            })
            
            .addCase(toggleLikeSongAsync.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.likedSongs = action.payload;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
                const likedPlaylist = state.userPlaylistsDetail.find(p => p.id === LIKED_SONGS_ID);
                if (likedPlaylist) {
                    likedPlaylist.songs = action.payload;
                }
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

export const { logout, setTestUser } = authSlice.actions; 
export default authSlice.reducer;