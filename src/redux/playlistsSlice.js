import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchUserPlaylists = createAsyncThunk(
  'playlists/fetchUserPlaylists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/playlists');
      return response.data; 
    } catch (error) {
      console.error("Erro ao buscar playlists:", error);
      return rejectWithValue(error.response?.data || 'Erro ao carregar playlists');
    }
  }
);

export const fetchPlaylistDetails = createAsyncThunk(
    'playlists/fetchDetails',
    async (playlistId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/playlists/${playlistId}`);
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao carregar detalhes da playlist');
        }
    }
);

export const createPlaylist = createAsyncThunk(
    'playlists/create',
    async ({ name, description, cover }, { rejectWithValue }) => {
        try {
            const response = await api.post('/playlists', { name, description, cover });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao criar playlist');
        }
    }
);

export const deletePlaylist = createAsyncThunk(
    'playlists/delete',
    async (playlistId, { rejectWithValue }) => {
        try {
            await api.delete(`/playlists/${playlistId}`);
            return playlistId; 
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao deletar playlist');
        }
    }
);

export const addSongToPlaylist = createAsyncThunk(
    'playlists/addSong',
    async ({ playlistId, songId }, { rejectWithValue }) => {
        try {
            const response = await api.post('/playlists/add-song', { playlistId, songId });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao adicionar música');
        }
    }
);


const initialState = {
  items: [], 
  status: 'idle', 
  error: null,

  currentPlaylist: null,
  currentPlaylistStatus: 'idle',
  
  createStatus: 'idle', 
  deleteStatus: 'idle',
  addSongStatus: 'idle'
};

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    clearCurrentPlaylist: (state) => {
        state.currentPlaylist = null;
        state.currentPlaylistStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPlaylists.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserPlaylists.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; 
      })
      .addCase(fetchUserPlaylists.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPlaylistDetails.pending, (state) => {
        state.currentPlaylistStatus = 'loading';
      })
      .addCase(fetchPlaylistDetails.fulfilled, (state, action) => {
        state.currentPlaylistStatus = 'succeeded';
        state.currentPlaylist = action.payload;
      })
      .addCase(fetchPlaylistDetails.rejected, (state, action) => {
        state.currentPlaylistStatus = 'failed';
      })
      .addCase(createPlaylist.pending, (state) => {
        state.createStatus = 'loading';
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.items.unshift(action.payload); 
      })
      .addCase(createPlaylist.rejected, (state) => {
        state.createStatus = 'failed';
      })
      .addCase(deletePlaylist.pending, (state) => {
        state.deleteStatus = 'loading';
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        state.items = state.items.filter(p => p._id !== action.payload);
      
        if (state.currentPlaylist && state.currentPlaylist._id === action.payload) {
            state.currentPlaylist = null;
        }
      })
      .addCase(addSongToPlaylist.fulfilled, (state, action) => {
        const updatedPlaylist = action.payload;

        const index = state.items.findIndex(p => p._id === updatedPlaylist._id);
        if (index !== -1) {
            state.items[index] = updatedPlaylist;
        }

        if (state.currentPlaylist && state.currentPlaylist._id === updatedPlaylist._id) {
            state.currentPlaylist = updatedPlaylist; 
        }
      });
  },
});

export const { clearCurrentPlaylist } = playlistsSlice.actions;

export default playlistsSlice.reducer;