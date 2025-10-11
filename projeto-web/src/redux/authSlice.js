import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import axios from 'axios';

const LIKED_SONGS_ID = "0";

export const toggleLikeSongAsync = createAsyncThunk(
    'auth/toggleLikeSong',
    async ({ userId, songId, currentLikedSongs }, { rejectWithValue }) => {
        const isLiked = currentLikedSongs.includes(songId);
        
        const newLikedSongs = isLiked
            ? currentLikedSongs.filter(id => id !== songId) 
            : [...currentLikedSongs, songId]; 
        
        try {
            await api.patch(`/users/${userId}`, { likedSongs: newLikedSongs });
            return newLikedSongs; 
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const addSongToPlaylistAsync = createAsyncThunk(
    'auth/addSongToPlaylist',
    async ({ userId, playlistId, songId }, { rejectWithValue }) => {
        try {
            if (playlistId === LIKED_SONGS_ID) {
                const userResponse = await api.get(`/users/${userId}`);
                const currentLikedSongs = userResponse.data.likedSongs || [];
                
                if (!currentLikedSongs.includes(songId)) {
                    const newLikedSongs = [...currentLikedSongs, songId].filter(Boolean);
                    await api.patch(`/users/${userId}`, { likedSongs: newLikedSongs });
                    return { songId, playlistId: LIKED_SONGS_ID, added: true };
                }
                return { songId: null, playlistId: LIKED_SONGS_ID, added: false };
            } else {
                const playlistResponse = await api.get(`/userPlaylists/${playlistId}`);
                const currentSongs = playlistResponse.data.songs || [];

                if (!currentSongs.includes(songId)) {
                    const updatedSongs = [...currentSongs, songId];
                    await api.patch(`/userPlaylists/${playlistId}`, { songs: updatedSongs });
                    return { songId, playlistId, added: true };
                }
                return { songId: null, playlistId, added: false };
            }
        } catch (error) {
            return rejectWithValue(error.response.data);
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
            return rejectWithValue(error.response.data);
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
            return rejectWithValue(error.response.data);
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
    user: null,
    isAuthenticated: false,
    token: null,
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
            .addCase(toggleLikeSongAsync.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.likedSongs = action.payload;
                    localStorage.setItem('user', JSON.stringify(state.user));
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
            .addCase(addSongToPlaylistAsync.fulfilled, (state, action) => {
                const { songId, playlistId, added } = action.payload;
                
                if (added && songId) {
                    if (playlistId === LIKED_SONGS_ID) {
                        if (state.user && !state.user.likedSongs.includes(songId)) {
                            state.user.likedSongs.push(songId);
                            localStorage.setItem('user', JSON.stringify(state.user));
                        }
                    } else {
                        const playlist = state.userPlaylistsDetail.find(p => p.id === playlistId);
                        if (playlist && !playlist.songs.includes(songId)) {
                            playlist.songs.push(songId);
                            playlist.songCount = playlist.songs.length;
                        }
                    }
                }
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