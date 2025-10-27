import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../services/api'; 

export const uploadMusicaToDB = createAsyncThunk(
    'dbUpload/uploadMusica',
    async (musicaData, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/topSongs`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(musicaData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData);
            }

            const data = await response.json();
            return data; 
        } catch (error) {
            console.error("Erro ao fazer upload para o DB:", error);
            return rejectWithValue("Falha ao conectar ou enviar dados para a API (Verifique o JSON Server).");
        }
    }
);

const dbUploadSlice = createSlice({
    name: 'dbUpload',
    initialState: {
        status: 'idle', 
        error: null,
    },
    reducers: {
        resetUploadStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadMusicaToDB.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(uploadMusicaToDB.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(uploadMusicaToDB.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message || 'Erro desconhecido no upload.';
            });
    },
});

export const { resetUploadStatus } = dbUploadSlice.actions;

export default dbUploadSlice.reducer;