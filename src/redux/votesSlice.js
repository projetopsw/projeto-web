import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3000/songs';

const initialSongState = {
    likes: 0,
    dislikes: 0,
    userAction: null, 
    status: 'idle',
    error: null,
};

const initialState = {};

export const fetchVotes = createAsyncThunk(
    'votes/fetchVotes',
    async ({ songId, userId }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/${songId}/status-voto?userId=${userId}`); 
            
            if (!response.ok) {
                if (response.status === 404) return { songId, likes: 0, dislikes: 0, userAction: null };
                throw new Error('Falha ao buscar votos.');
            }
            
            const data = await response.json();
            return { songId, ...data };

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const toggleVote = createAsyncThunk(
    'votes/toggleVote',
    async ({ songId, userId, action, token }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/${songId}/interacao`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, action }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao processar voto.');
            }

            const data = await response.json();
            return { songId, ...data }; 
            
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
                const songId = action.meta.arg.songId;
                if (!state[songId]) {
                    state[songId] = { ...initialSongState, status: 'loading' };
                } else {
                    state[songId].status = 'loading';
                }
            })
            .addCase(fetchVotes.fulfilled, (state, action) => {
                const { songId, likes, dislikes, userAction } = action.payload;
                state[songId] = {
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
                const songId = action.meta.arg.songId;
                if (!state[songId]) {
                    state[songId] = { ...initialSongState, status: 'failed', error: action.payload };
                } else {
                    state[songId].status = 'failed';
                    state[songId].error = action.payload;
                }
            })

            .addCase(toggleVote.pending, (state, action) => {
                const songId = action.meta.arg.songId;
                if (state[songId]) {
                    state[songId].status = 'loading';
                    state[songId].error = null;
                }
            })
            .addCase(toggleVote.fulfilled, (state, action) => {
                const { songId, likes, dislikes, userAction } = action.payload;
                state[songId].status = 'succeeded';
                state[songId].likes = likes;
                state[songId].dislikes = dislikes;
                state[songId].userAction = userAction;
                state[songId].userVoted = !!userAction; 
            })
            .addCase(toggleVote.rejected, (state, action) => {
                const songId = action.meta.arg.songId;
                if (state[songId]) {
                    state[songId].status = 'failed';
                    state[songId].error = action.payload;
                }
            });
    },
});

export default votesSlice.reducer;