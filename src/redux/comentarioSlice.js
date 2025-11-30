import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mongoApi from '../services/mongoApi';

const API_URL = '/api/comentarios'; 

const fetchComments = createAsyncThunk(
    'comments/fetchComments',
    async (musicaId) => {
        const response = await mongoApi.get(`${API_URL}/${musicaId}`);
        return { musicaId, comments: response.data };
    }
);

const postComment = createAsyncThunk(
    'comments/postComment',
    async (commentData, { rejectWithValue }) => {
        try {
            const response = await mongoApi.post(API_URL, commentData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const initialState = {};

export const commentsSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchComments.pending, (state, action) => {
                const musicaId = action.meta.arg;
                state[musicaId] = state[musicaId] || { data: [], status: 'loading', error: null };
                state[musicaId].status = 'loading';
            })
            .addCase(fetchComments.fulfilled, (state, action) => {
                const { musicaId, comments } = action.payload;
                state[musicaId] = { 
                    data: comments, 
                    status: 'succeeded', 
                    error: null 
                };
            })
            .addCase(fetchComments.rejected, (state, action) => {
                const musicaId = action.meta.arg;
                state[musicaId] = state[musicaId] || { data: [], status: 'failed', error: action.error.message };
                state[musicaId].status = 'failed';
                state[musicaId].error = action.error.message;
            })
            .addCase(postComment.fulfilled, (state, action) => {
                const novoComentario = action.payload;
                const { musicaId } = novoComentario;
                
                if (state[musicaId]) {
                    state[musicaId].data.unshift(novoComentario); 
                } else {
                    state[musicaId] = { data: [novoComentario], status: 'succeeded', error: null };
                }
            })
    },
});

export { fetchComments, postComment };

export default commentsSlice.reducer;