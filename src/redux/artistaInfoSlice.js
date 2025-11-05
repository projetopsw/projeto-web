import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/artists'; 

export const fetchArtists = createAsyncThunk(
  'artistInfo/fetchArtists',
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
      .addCase(fetchArtists.pending, (state) => {
        state.isLoading = 'loading';
        state.error = null;
      })
      .addCase(fetchArtists.fulfilled, (state, action) => {
        state.isLoading = 'succeeded';
        state.allArtists = action.payload;
        state.artistMap = action.payload.reduce((map, artist) => {
          map[artist.id] = artist;
          return map;
        }, {});
      })
      .addCase(fetchArtists.rejected, (state, action) => {
        state.isLoading = 'failed';
        state.error = action.payload || 'Falha na requisição de dados.';
        state.allArtists = []; 
        state.artistMap = {};
      });
  },
});

export default artistInfoSlice.reducer;