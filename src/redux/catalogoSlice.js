import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { logout } from './loginSlice';

export const fetchArtists = createAsyncThunk('catalog/fetchArtists', async () => {
  const response = await api.get('/topArtists');
  return response.data;
});

export const fetchAlbums = createAsyncThunk('catalog/fetchAlbums', async () => {
  const response = await api.get('/topAlbums');
  return response.data;
});

export const fetchArtistById = createAsyncThunk('catalog/fetchArtistById', async (artistId) => {
  const response = await api.get(`/topArtists/${artistId}`);
  return response.data;
});

export const fetchSongById = createAsyncThunk('catalog/fetchSongById', async (songId) => {
  const response = await api.get(`/topSongs/${songId}`);
  return response.data;
});

export const fetchAlbumsByArtist = createAsyncThunk(
  'catalog/fetchAlbumsByArtist',
  async (artistName) => {
    const response = await api.get(`/topAlbums?artist_like=${artistName}`);
    return response.data;
  }
);
export const fetchArtistsByIds = createAsyncThunk(
  'catalog/fetchArtistsByIds',
  async (artistIds) => {
    if (!artistIds || artistIds.length === 0) return [];
    
    const response = await api.get('/topArtists');
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
    
    const response = await api.get(`/topSongs?${queryParams}`);
    return response.data; 
  }
);

const initialState = {
  artists: {
    items: [],
    status: 'idle', 
    error: null,
  },
  albums: {
    items: [],
    status: 'idle',
    error: null,
  },
  selectedArtist: {
    details: null,
    status: 'idle',
    error: null,
  },
  selectedSong: {
    details: null,
    status: 'idle',
    error: null,
  },
  albumsByArtist: {
    items: [],
    status: 'idle',
    error: null,
  },
  followedArtists: {
    items: [],
    status: 'idle',
    error: null,
  },
  likedSongsDetails: {
    items: [],
    status: 'idle',
    error: null,
  }
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {}, 
  extraReducers: (builder) => {
    builder
      .addCase(fetchArtists.pending, (state) => {
        state.artists.status = 'loading';
      })
      .addCase(fetchArtists.fulfilled, (state, action) => {
        state.artists.status = 'succeeded';
        state.artists.items = action.payload;
      })
      .addCase(fetchArtists.rejected, (state, action) => {
        state.artists.status = 'failed';
        state.artists.error = action.error.message;
      })
      .addCase(fetchAlbums.pending, (state) => {
        state.albums.status = 'loading';
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.albums.status = 'succeeded';
        state.albums.items = action.payload;
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.albums.status = 'failed';
        state.albums.error = action.error.message;
      })
      .addCase(fetchArtistById.pending, (state) => {
        state.selectedArtist.status = 'loading';
      })
      .addCase(fetchArtistById.fulfilled, (state, action) => {
        state.selectedArtist.status = 'succeeded';
        state.selectedArtist.details = action.payload;
      })
      .addCase(fetchArtistById.rejected, (state, action) => {
        state.selectedArtist.status = 'failed';
        state.selectedArtist.error = action.error.message;
      })
      .addCase(fetchSongById.pending, (state) => {
        state.selectedSong.status = 'loading';
      })
      .addCase(fetchSongById.fulfilled, (state, action) => {
        state.selectedSong.status = 'succeeded';
        state.selectedSong.details = action.payload;
      })
      .addCase(fetchSongById.rejected, (state, action) => {
        state.selectedSong.status = 'failed';
        state.selectedSong.error = action.error.message;
      })
      .addCase(fetchAlbumsByArtist.pending, (state) => {
        state.albumsByArtist.status = 'loading';
      })
      .addCase(fetchAlbumsByArtist.fulfilled, (state, action) => {
        state.albumsByArtist.status = 'succeeded';
        state.albumsByArtist.items = action.payload;
      })
      .addCase(fetchAlbumsByArtist.rejected, (state, action) => {
        state.albumsByArtist.status = 'failed';
        state.albumsByArtist.error = action.error.message;
      })
      .addCase(fetchArtistsByIds.pending, (state) => {
        state.followedArtists.status = 'loading';
      })
      .addCase(fetchArtistsByIds.fulfilled, (state, action) => {
        state.followedArtists.status = 'succeeded';
        state.followedArtists.items = action.payload;
      })
      .addCase(fetchArtistsByIds.rejected, (state, action) => {
        state.followedArtists.status = 'failed';
        state.followedArtists.error = action.error.message;
      })
      .addCase(fetchSongsByIds.pending, (state) => {
        state.likedSongsDetails.status = 'loading';
      })
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
      });
  },
})

export default catalogSlice.reducer;