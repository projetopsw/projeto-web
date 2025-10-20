import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/topArtists'; 

export const fetchTopArtists = createAsyncThunk(
  'artistInfo/fetchTopArtists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        return rejectWithValue(`Erro ${response.status}: Falha ao buscar artistas.`);
      }

      const data = await response.json();
      return data; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  allArtists: [], 
  artistMap: {}, 
  isLoading: 'idle', 
  error: null,
};


const artistInfoSlice = createSlice({
  name: 'artistInfo',
  initialState,
  reducers: {}, 
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopArtists.pending, (state) => {
        state.isLoading = 'loading';
        state.error = null;
      })
      .addCase(fetchTopArtists.fulfilled, (state, action) => {
        state.isLoading = 'succeeded';
        state.allArtists = action.payload;
        state.artistMap = action.payload.reduce((map, artist) => {
          map[artist.id] = artist;
          return map;
        }, {});
      })
      .addCase(fetchTopArtists.rejected, (state, action) => {
        state.isLoading = 'failed';
        state.error = action.payload || 'Falha na requisição de dados.';
        state.allArtists = []; 
        state.artistMap = {};
      });
  },
});

export default artistInfoSlice.reducer;