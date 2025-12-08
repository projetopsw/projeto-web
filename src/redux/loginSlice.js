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
            
            const { user, token } = response.data;
            const userWithToken = { ...user, role: user.role || 'user', token: token }; 
            
            dispatch(setUserData(userWithToken)); 
            localStorage.setItem('token', token); 
            
            return { userWithToken }; 
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
    async ({ songId }, { rejectWithValue }) => { 
        try {
            const response = await api.post('/playlists/like', { songId });
            
            return { 
                songId, 
                isLiked: response.data.isLiked 
            };
        } catch (error) {
            console.error("Erro ao curtir:", error);
            return rejectWithValue(error.response?.data?.message || 'Falha ao curtir música.');
        }
    }
);

export const addSongToPlaylistAsync = createAsyncThunk(
    'auth/addSongToPlaylist',
    async ({ playlistId, songId }, { rejectWithValue, dispatch }) => {
        try {
            if (playlistId === LIKED_SONGS_ID) {
                const result = await dispatch(toggleLikeSongAsync({ songId })).unwrap();
                return { 
                    songId, 
                    playlistId: LIKED_SONGS_ID, 
                    added: result.isLiked, 
                    message: result.isLiked ? "Música curtida!" : "Música descurtida." 
                };
            } 
            
            const response = await api.post('/playlists/add-song', { playlistId, songId });
            

            return { 
                songId, 
                playlistId, 
                updatedPlaylist: response.data, 
                added: true, 
                message: "Adicionada à playlist com sucesso!" 
            };

        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Falha ao adicionar música.');
        }
    }
);

export const fetchUserPlaylistsDetail = createAsyncThunk(
    'auth/fetchUserPlaylistsDetail',
    async (userId, { rejectWithValue }) => {
        try {
            const userResponse = await api.get(`/users/${userId}`);
            const userData = userResponse.data || {};
         
            const playlistsResponse = await api.get('/playlists');
            const allUserPlaylists = playlistsResponse.data || [];

            const dbLikedPlaylist = allUserPlaylists.find(p => p.isLikedSongs);
            const realCustomPlaylists = allUserPlaylists.filter(p => !p.isLikedSongs);

            const likedSongsIds = (userData.likedSongs || []).filter(Boolean);
            
            const likedPlaylistFinal = {
                id: dbLikedPlaylist ? dbLikedPlaylist._id : '0',
                _id: dbLikedPlaylist ? dbLikedPlaylist._id : '0',
                name: 'Músicas Curtidas',
                img: '/assets/img/liked_cover_0.png',
                songs: dbLikedPlaylist ? dbLikedPlaylist.songs : likedSongsIds,
                songCount: dbLikedPlaylist ? dbLikedPlaylist.songs?.length : likedSongsIds.length,
                duration: `${dbLikedPlaylist ? dbLikedPlaylist.songs?.length : likedSongsIds.length} músicas`,
                isLikedSongs: true
            };
            
            return [likedPlaylistFinal, ...realCustomPlaylists];

        } catch (error) {
            console.error("Erro no Redux fetchUserPlaylistsDetail:", error);
            return [{
                id: '0',
                name: 'Músicas Curtidas',
                img: '/assets/img/liked_cover_0.png',
                songs: [],
                songCount: 0,
                isLikedSongs: true
            }];
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
        },
        setTestUser: (state, action) => {
            state.isAuthenticated = true;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUserAsync.fulfilled, (state, action) => {
                const token = action.payload?.userWithToken?.token;
                if (token) {
                    state.isAuthenticated = true;
                    state.token = token;
                    state.loginError = null;
                    localStorage.setItem('token', token);
                } else {
                    state.isAuthenticated = false;
                    state.token = null;
                }
            })
            .addCase(loginUserAsync.rejected, (state, action) => {
                state.loginError = action.payload;
                state.isAuthenticated = false;
                state.token = null; 
                localStorage.removeItem('token'); 
            })

            .addCase(handleSpotifyCallback.fulfilled, (state, action) => {
                const token = action.payload?.token;
                if (token) {
                    state.isAuthenticated = true;
                    state.token = token;
                    state.loginError = null;
                    localStorage.setItem('token', token);
                } else {
                    state.isAuthenticated = false;
                    state.token = null;
                }
            })
            .addCase(handleSpotifyCallback.rejected, (state, action) => {
                state.loginError = action.payload;
                state.isAuthenticated = false;
                state.token = null; 
            })
            
            .addCase(addSongToPlaylistAsync.fulfilled, (state, action) => {
                const { playlistId, updatedPlaylist } = action.payload;
                
                if (playlistId !== LIKED_SONGS_ID && updatedPlaylist) {
                    const index = state.userPlaylistsDetail.findIndex(p => p.id === playlistId || p._id === playlistId);
                    if (index !== -1) {
                        state.userPlaylistsDetail[index] = {
                            ...state.userPlaylistsDetail[index],
                            songs: updatedPlaylist.songs,
                            songCount: updatedPlaylist.songs?.length || 0
                        };
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
            })
            .addCase(toggleLikeSongAsync.fulfilled, (state, action) => {
                const { songId, isLiked } = action.payload;

                const likedPlaylist = state.userPlaylistsDetail.find(p => p.id === '0');
                
                if (likedPlaylist) {
                    if (isLiked) {
                        if (!likedPlaylist.songs.some(s => s === songId || s._id === songId)) {
                            likedPlaylist.songs.push(songId);
                            likedPlaylist.songCount = (likedPlaylist.songCount || 0) + 1;
                        }
                    } else {
                        likedPlaylist.songs = likedPlaylist.songs.filter(s => s !== songId && s._id !== songId);
                        likedPlaylist.songCount = Math.max(0, (likedPlaylist.songCount || 1) - 1);
                    }
                }
            })

            
    },
});

export const { logout, setTestUser } = authSlice.actions; 
export default authSlice.reducer;