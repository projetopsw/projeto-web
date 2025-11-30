import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';


const API_URL = 'http://localhost:3000/musicas'; 


const initialSongState = {
    likes: 0,
    dislikes: 0,
    userVoted: false, 
    userAction: null, 
    status: 'idle',
    error: null,
};

const initialState = {};


export const fetchVotes = createAsyncThunk(
    'votes/fetchVotes',
    async ({ musicaId, userId }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/${musicaId}/status-voto?userId=${userId}`); 
            
            if (!response.ok) {
                if (response.status === 404) return { musicaId, likes: 0, dislikes: 0, userAction: null };
                throw new Error('Falha ao buscar votos.');
            }
            
            const data = await response.json();
            return { musicaId, ...data };

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


export const toggleVote = createAsyncThunk(
    'votes/toggleVote',
    async ({ musicaId, userId, action }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/${musicaId}/interacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao processar voto.');
            }

            const data = await response.json();
            return { musicaId, ...data }; 
            
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


export const votesSlice = createSlice({
    name: 'votes',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVotes.pending, (state, action) => {
                const musicaId = action.meta.arg.musicaId;
                if (!state[musicaId]) {
                    state[musicaId] = { ...initialSongState, status: 'loading' };
                } else {
                    state[musicaId].status = 'loading';
                }
            })
            .addCase(fetchVotes.fulfilled, (state, action) => {
                const { musicaId, likes, dislikes, userAction } = action.payload;
                state[musicaId] = {
                    ...initialSongState,
                    likes: likes || 0,
                    dislikes: dislikes || 0,
                    userAction: userAction || null,
                    userVoted: !!userAction,
                    status: 'succeeded',
                    error: null,
                };
            })
            .addCase(fetchVotes.rejected, (state, action) => {
                const musicaId = action.meta.arg.musicaId;
                if (!state[musicaId]) {
                    state[musicaId] = { ...initialSongState, status: 'failed', error: action.payload };
                } else {
                    state[musicaId].status = 'failed';
                    state[musicaId].error = action.payload;
                }
            })

            .addCase(toggleVote.fulfilled, (state, action) => {
                const { musicaId, likes, dislikes, userAction } = action.payload;
                state[musicaId].status = 'succeeded';
                state[musicaId].likes = likes;
                state[musicaId].dislikes = dislikes;
                state[musicaId].userAction = userAction;
                state[musicaId].userVoted = !!userAction; 
            })
    },
});

export default votesSlice.reducer;