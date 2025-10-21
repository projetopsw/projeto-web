import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    "default-song-placeholder": {
        likes: 15,
        dislikes: 3,
        userRating: 0,
    }
};

export const votesSlice = createSlice({
  name: 'votes',
  initialState,
  reducers: {
    toggleVote: (state, action) => {
      const { musicaId, voteType } = action.payload; 
      
      if (!state[musicaId]) {
        state[musicaId] = { likes: 0, dislikes: 0, userRating: 0 };
      }

      const current = state[musicaId];
      const newRating = (voteType === 'like' ? 1 : -1);

      if (current.userRating === newRating) {
        current.userRating = 0;
        current[voteType + 's'] -= 1; 

      } else if (current.userRating === 0) {
        current.userRating = newRating;
        current[voteType + 's'] += 1;

      } else {
        
        const prevVoteType = current.userRating === 1 ? 'likes' : 'dislikes';
        current[prevVoteType] -= 1;

        current.userRating = newRating;
        current[voteType + 's'] += 1;
      }
    },
  },
});

export const { toggleVote } = votesSlice.actions;

export default votesSlice.reducer;