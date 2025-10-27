import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    musicas: [
    ],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};


export const uploadSlice = createSlice({
    name: 'uploadMusica', 
    initialState,
    reducers: {
        uploadMusica: (state, action) => {
            const novaMusica = action.payload;
            state.musicas.push(novaMusica);
            state.status = 'succeeded'; 
        },
        resetStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        },
    },
});

export const { uploadMusica, resetStatus } = uploadSlice.actions;

export default uploadSlice.reducer;

export const selectMusicas = (state) => state.uploadMusica.musicas;
export const selectUploadStatus = (state) => state.uploadMusica.status;