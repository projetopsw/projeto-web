import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// URL DO JSON SERVER
const API_URL = 'http://localhost:3001/topArtists'; 

// 1. AÇÃO ASSÍNCRONA (THUNK)
export const fetchTopArtists = createAsyncThunk(
  'artistInfo/fetchTopArtists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_URL);

      // Verifica se a resposta HTTP é bem-sucedida
      if (!response.ok) {
        // Lança um erro se o status for 404, 500, etc.
        return rejectWithValue(`Erro ${response.status}: Falha ao buscar artistas.`);
      }

      const data = await response.json();
      return data; // Retorna o array de artistas
    } catch (error) {
      // Captura erros de rede (servidor offline, CORS)
      return rejectWithValue(error.message);
    }
  }
);

// ESTADO INICIAL
const initialState = {
  // allArtists agora será preenchido pelos dados da API
  allArtists: [], 
  artistMap: {}, // O mapa será construído após o sucesso da requisição
  isLoading: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};


const artistInfoSlice = createSlice({
  name: 'artistInfo',
  initialState,
  // 2. REDUCERS SÍNCRONOS
  reducers: {}, 
  
  // 3. EXTRA REDUCERS (Lógica para Ações Assíncronas)
  extraReducers: (builder) => {
    builder
      // Quando a requisição está PENDENTE
      .addCase(fetchTopArtists.pending, (state) => {
        state.isLoading = 'loading';
        state.error = null;
      })
      // Quando a requisição é CONCLUÍDA com sucesso
      .addCase(fetchTopArtists.fulfilled, (state, action) => {
        state.isLoading = 'succeeded';
        state.allArtists = action.payload;
        // Recria o mapa com os dados obtidos da API
        state.artistMap = action.payload.reduce((map, artist) => {
          map[artist.id] = artist;
          return map;
        }, {});
      })
      // Quando a requisição é REJEITADA
      .addCase(fetchTopArtists.rejected, (state, action) => {
        state.isLoading = 'failed';
        // O erro virá do rejectWithValue
        state.error = action.payload || 'Falha na requisição de dados.';
        state.allArtists = []; // Limpa os artistas em caso de falha
        state.artistMap = {};
      });
  },
});

export default artistInfoSlice.reducer;