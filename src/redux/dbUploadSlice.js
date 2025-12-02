import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../services/api'; 

export const uploadMusicaToDB = createAsyncThunk(
    'dbUpload/uploadMusica',
    async ({ formData, token }, { rejectWithValue }) => {
        try {
            if (!token) {
                return rejectWithValue("Token de autenticação ausente. Por favor, faça login.");
            }
            const response = await fetch(`${API_BASE_URL}/songs`, { 
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || `Erro do servidor: ${response.status}`;
                return rejectWithValue(errorMessage);
            }

            const data = await response.json();
            return data; 
        } catch (error) {
            return rejectWithValue("Falha ao conectar ou enviar dados para a API.");
        }
    }
);

const dbUploadSlice = createSlice({
    name: 'dbUpload',
    initialState: {
        status: 'idle', 
        error: null,
        uploadedSongData: null, 
    },
    reducers: {
        resetUploadStatus: (state) => {
            state.status = 'idle';
            state.error = null;
            state.uploadedSongData = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadMusicaToDB.pending, (state) => {
                state.status = 'loading';
                state.error = null;
                state.uploadedSongData = null;
            })
            .addCase(uploadMusicaToDB.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.uploadedSongData = action.payload; 
            })
            .addCase(uploadMusicaToDB.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message || 'Erro desconhecido no upload.';
            });
    },
});

export const { resetUploadStatus } = dbUploadSlice.actions;

export default dbUploadSlice.reducer;