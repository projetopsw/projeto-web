import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// --- THUNKS (Ações Assíncronas) ---

// 1. Buscar todas as playlists do usuário (para o Menu Lateral e Home)
export const fetchUserPlaylists = createAsyncThunk(
  'playlists/fetchUserPlaylists',
  async (_, { rejectWithValue }) => {
    try {
      // O backend já filtra pelo usuário logado (req.user.id)
      const response = await api.get('/playlists');
      return response.data; 
    } catch (error) {
      console.error("Erro ao buscar playlists:", error);
      return rejectWithValue(error.response?.data || 'Erro ao carregar playlists');
    }
  }
);

// 2. Buscar detalhes de UMA playlist específica (para a página de Detalhes)
export const fetchPlaylistDetails = createAsyncThunk(
    'playlists/fetchDetails',
    async (playlistId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/playlists/${playlistId}`);
            return response.data; // Deve retornar a playlist com o array de 'songs' populado
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao carregar detalhes da playlist');
        }
    }
);

// 3. Criar nova Playlist
export const createPlaylist = createAsyncThunk(
    'playlists/create',
    async ({ name, description, cover }, { rejectWithValue }) => {
        try {
            const response = await api.post('/playlists', { name, description, cover });
            return response.data; // Retorna a nova playlist criada
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao criar playlist');
        }
    }
);

// 4. Deletar Playlist
export const deletePlaylist = createAsyncThunk(
    'playlists/delete',
    async (playlistId, { rejectWithValue }) => {
        try {
            await api.delete(`/playlists/${playlistId}`);
            return playlistId; // Retorna o ID para removermos da lista localmente
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao deletar playlist');
        }
    }
);

// 5. Adicionar música a uma playlist existente
export const addSongToPlaylist = createAsyncThunk(
    'playlists/addSong',
    async ({ playlistId, songId }, { rejectWithValue }) => {
        try {
            const response = await api.post('/playlists/add-song', { playlistId, songId });
            return response.data; // Retorna a playlist atualizada
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erro ao adicionar música');
        }
    }
);

// --- SLICE ---

const initialState = {
  // Lista geral (sidebar)
  items: [], 
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // Playlist atual (página de detalhes)
  currentPlaylist: null,
  currentPlaylistStatus: 'idle',
  
  // Status de ações específicas (para loading de botões/modais)
  createStatus: 'idle', 
  deleteStatus: 'idle',
  addSongStatus: 'idle'
};

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    // Ação para limpar a playlist atual ao sair da página de detalhes
    clearCurrentPlaylist: (state) => {
        state.currentPlaylist = null;
        state.currentPlaylistStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // --- FETCH ALL ---
      .addCase(fetchUserPlaylists.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserPlaylists.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; // O backend já manda a lista certa
      })
      .addCase(fetchUserPlaylists.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- FETCH DETAILS ---
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

      // --- CREATE ---
      .addCase(createPlaylist.pending, (state) => {
        state.createStatus = 'loading';
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        // Adiciona a nova playlist no topo da lista local
        state.items.unshift(action.payload); 
      })
      .addCase(createPlaylist.rejected, (state) => {
        state.createStatus = 'failed';
      })

      // --- DELETE ---
      .addCase(deletePlaylist.pending, (state) => {
        state.deleteStatus = 'loading';
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        // Remove da lista local pelo ID
        state.items = state.items.filter(p => p._id !== action.payload);
        
        // Se a playlist deletada for a que estamos vendo agora, limpa ela
        if (state.currentPlaylist && state.currentPlaylist._id === action.payload) {
            state.currentPlaylist = null;
        }
      })

      // --- ADD SONG ---
      .addCase(addSongToPlaylist.fulfilled, (state, action) => {
        const updatedPlaylist = action.payload;

        // 1. Atualiza na lista lateral (opcional, se quiser atualizar contador de músicas)
        const index = state.items.findIndex(p => p._id === updatedPlaylist._id);
        if (index !== -1) {
            state.items[index] = updatedPlaylist;
        }

        // 2. Se estivermos vendo essa playlist agora, atualiza ela também
        if (state.currentPlaylist && state.currentPlaylist._id === updatedPlaylist._id) {
            // Nota: O endpoint addSong retorna a playlist, mas talvez não populada com detalhes da música.
            // O ideal aqui seria apenas atualizar o array de IDs ou refazer o fetchDetails.
            // Para simplificar, atualizamos o que veio:
            state.currentPlaylist = updatedPlaylist; 
        }
      });
  },
});

export const { clearCurrentPlaylist } = playlistsSlice.actions;

export default playlistsSlice.reducer;