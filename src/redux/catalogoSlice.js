import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from './loginSlice';
import axios from 'axios';

// URL DEFINITIVA DO SEU BACKEND EXPRESS (MongoDB / Spotify Proxy)
const API_URL = 'http://127.0.0.1:3000'; 

// THUNK GENÉRICA PARA BUSCAR DADOS DO SPOTIFY VIA PROXY
export const fetchSpotifyData = createAsyncThunk(
    'catalog/fetchSpotifyData',
    async (endpoint, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token'); 
            if (!token) throw new Error('Usuário Moosica não autenticado.');

            // A chamada vai para o seu endpoint proxy /api/spotify/data no Express
            const response = await axios.get(`${API_URL}/api/spotify/data`, {
                params: { endpoint: endpoint },
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            return response.data; 
        } catch (error) {
            console.error("ERRO NO PROXY SPOTIFY:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Falha ao buscar dados do Spotify.');
        }
    }
);

// MÚSICAS (SPOTIFY)
export const fetchTopTracks = createAsyncThunk(
    'catalog/fetchTopTracks',
    async (_, { dispatch, rejectWithValue }) => {
        const result = await dispatch(fetchSpotifyData('/v1/me/top/tracks?limit=30'));
        
        if (result.meta.requestStatus === 'rejected') {
            return rejectWithValue(result.payload);
        }
        
        if (!result.payload || !Array.isArray(result.payload.items)) {
            return rejectWithValue("Estrutura de dados Top Tracks inesperada.");
        }
        
        return result.payload.items.map(spotifyTrack => ({
            id: spotifyTrack.id,
            title: spotifyTrack.name,
            artist: spotifyTrack.artists.map(a => a.name).join(', '),
            artistId: spotifyTrack.artists[0]?.id,
            cover: spotifyTrack.album.images[0]?.url || '',
            album: spotifyTrack.album.name,
            duration: spotifyTrack.duration_ms, 
        }));
    }
);

// ARTISTAS (SPOTIFY)
export const fetchArtists = createAsyncThunk('catalog/fetchArtists', async (_, { dispatch, rejectWithValue }) => {
    const result = await dispatch(fetchSpotifyData('/v1/me/top/artists?limit=20'));
    
    if (result.meta.requestStatus === 'rejected') {
        return rejectWithValue(result.payload);
    }
    if (!result.payload || !Array.isArray(result.payload.items)) {
         return rejectWithValue("Estrutura de dados Artists inesperada.");
    }

    return result.payload.items.map(spotifyArtist => ({
        id: spotifyArtist.id,
        name: spotifyArtist.name,
        image: spotifyArtist.images[0]?.url || '',
        genre: spotifyArtist.genres[0] || 'Pop',
    }));
});

// PLAYLISTS (SPOTIFY)
export const fetchPlaylists = createAsyncThunk('catalog/fetchPlaylists', async (_, { dispatch, rejectWithValue }) => {
    const result = await dispatch(fetchSpotifyData('/v1/browse/featured-playlists?limit=10'));
    
    if (result.meta.requestStatus === 'rejected') {
        return rejectWithValue(result.payload);
    }
    
    if (!result.payload || !result.payload.playlists || !Array.isArray(result.payload.playlists.items)) {
         return rejectWithValue("Estrutura de dados Playlists inesperada.");
    }

    return result.payload.playlists.items.map(spotifyPlaylist => ({
        id: spotifyPlaylist.id,
        title: spotifyPlaylist.name,
        cover: spotifyPlaylist.images[0]?.url || '',
        description: spotifyPlaylist.description,
        artist: spotifyPlaylist.owner.display_name,
    }));
});

// ÁLBUNS (MONGO - CORRIGIDO PARA USAR API_URL)
export const fetchAlbums = createAsyncThunk('catalog/fetchAlbums', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${API_URL}/albums`); // **CORREÇÃO AQUI**
        return response.data;
    } catch (error) {
         return rejectWithValue('Falha ao buscar álbuns do Mongo.');
    }
});

// DETALHES (MONGO - CORRIGIDO PARA USAR API_URL)
export const fetchArtistById = createAsyncThunk('catalog/fetchArtistById', async (artistId) => {
    const response = await axios.get(`${API_URL}/artists/${artistId}`);
    return response.data;
});

export const fetchSongById = createAsyncThunk('catalog/fetchSongById', async (songId) => {
    const response = await axios.get(`${API_URL}/songs/${songId}`);
    return response.data;
});

export const fetchAlbumsByArtist = createAsyncThunk(
    'catalog/fetchAlbumsByArtist',
    async (artistName) => {
        const response = await axios.get(`${API_URL}/albums?artist_like=${artistName}`);
        return response.data;
    }
);
export const fetchArtistsByIds = createAsyncThunk(
    'catalog/fetchArtistsByIds',
    async (artistIds) => {
        if (!artistIds || artistIds.length === 0) return [];
        const response = await axios.get(`${API_URL}/artists`);
        const allArtists = response.data;
        const filteredArtists = allArtists.filter(artist => artistIds.includes(String(artist.id)));
        return filteredArtists;
    }
);

export const fetchSongsByIds = createAsyncThunk(
    'catalog/fetchSongsByIds',
    async (songIds) => {
        if (!songIds || songIds.length === 0) return [];
        const queryParams = songIds.map(id => `id=${id}`).join('&');
        const response = await axios.get(`${API_URL}/songs?${queryParams}`);
        return response.data; 
    }
);


const initialState = {
    songs: { items: [], status: 'idle', error: null, },
    artists: { items: [], status: 'idle', error: null, },
    albums: { items: [], status: 'idle', error: null, },
    playlists: { items: [], status: 'idle', error: null, },
    selectedArtist: { details: null, status: 'idle', error: null, },
    selectedSong: { details: null, status: 'idle', error: null, },
    albumsByArtist: { items: [], status: 'idle', error: null, },
    followedArtists: { items: [], status: 'idle', error: null, },
    likedSongsDetails: { items: [], status: 'idle', error: null, }
};

const catalogSlice = createSlice({
    name: 'catalog',
    initialState,
    reducers: {}, 
    extraReducers: (builder) => {
        builder
            .addCase(fetchTopTracks.pending, (state) => { state.songs.status = 'loading'; })
            .addCase(fetchTopTracks.fulfilled, (state, action) => {
                state.songs.status = 'succeeded';
                state.songs.items = action.payload;
            })
            .addCase(fetchTopTracks.rejected, (state, action) => {
                state.songs.status = 'failed';
                state.songs.error = action.payload;
            })
            
            .addCase(fetchArtists.pending, (state) => { state.artists.status = 'loading'; })
            .addCase(fetchArtists.fulfilled, (state, action) => {
                state.artists.status = 'succeeded';
                state.artists.items = action.payload;
            })
            .addCase(fetchArtists.rejected, (state, action) => {
                state.artists.status = 'failed';
                state.artists.error = action.error.message;
            })

            .addCase(fetchPlaylists.pending, (state) => { state.playlists.status = 'loading'; })
            .addCase(fetchPlaylists.fulfilled, (state, action) => {
                state.playlists.status = 'succeeded';
                state.playlists.items = action.payload;
            })
            .addCase(fetchPlaylists.rejected, (state, action) => {
                state.playlists.status = 'failed';
                state.playlists.error = action.error.message;
            })
            
            .addCase(fetchAlbums.pending, (state) => { state.albums.status = 'loading'; })
            .addCase(fetchAlbums.fulfilled, (state, action) => {
                state.albums.status = 'succeeded';
                state.albums.items = action.payload;
            })
            .addCase(fetchAlbums.rejected, (state, action) => {
                state.albums.status = 'failed';
                state.albums.error = action.error.message;
            })

            .addCase(fetchArtistById.pending, (state) => { state.selectedArtist.status = 'loading'; })
            .addCase(fetchArtistById.fulfilled, (state, action) => {
                state.selectedArtist.status = 'succeeded';
                state.selectedArtist.details = action.payload;
            })
            .addCase(fetchArtistById.rejected, (state, action) => {
                state.selectedArtist.status = 'failed';
                state.selectedArtist.error = action.error.message;
            })
            .addCase(fetchSongById.pending, (state) => { state.selectedSong.status = 'loading'; })
            .addCase(fetchSongById.fulfilled, (state, action) => {
                state.selectedSong.status = 'succeeded';
                state.selectedSong.details = action.payload;
            })
            .addCase(fetchSongById.rejected, (state, action) => {
                state.selectedSong.status = 'failed';
                state.selectedSong.error = action.error.message;
            })
            .addCase(fetchAlbumsByArtist.pending, (state) => { state.albumsByArtist.status = 'loading'; })
            .addCase(fetchAlbumsByArtist.fulfilled, (state, action) => {
                state.albumsByArtist.status = 'succeeded';
                state.albumsByArtist.items = action.payload;
            })
            .addCase(fetchAlbumsByArtist.rejected, (state, action) => {
                state.albumsByArtist.status = 'failed';
                state.albumsByArtist.error = action.error.message;
            })
            .addCase(fetchArtistsByIds.pending, (state) => { state.followedArtists.status = 'loading'; })
            .addCase(fetchArtistsByIds.fulfilled, (state, action) => {
                state.followedArtists.status = 'succeeded';
                state.followedArtists.items = action.payload;
            })
            .addCase(fetchArtistsByIds.rejected, (state, action) => {
                state.followedArtists.status = 'failed';
                state.followedArtists.error = action.error.message;
            })
            .addCase(fetchSongsByIds.pending, (state) => { state.likedSongsDetails.status = 'loading'; })
            .addCase(fetchSongsByIds.fulfilled, (state, action) => {
                state.likedSongsDetails.status = 'succeeded';
                state.likedSongsDetails.items = action.payload;
            })
            .addCase(fetchSongsByIds.rejected, (state, action) => {
                state.likedSongsDetails.status = 'failed';
                state.likedSongsDetails.error = action.error.message;
            })
            .addCase(logout, (state) => {
                state.followedArtists = initialState.followedArtists;
                state.likedSongsDetails = initialState.likedSongsDetails;
                state.songs = initialState.songs; 
            });
    },
})

export default catalogSlice.reducer;