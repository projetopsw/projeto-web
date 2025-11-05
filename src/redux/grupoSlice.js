import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/groups');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await api.delete(`/groups/${groupId}`);
      return groupId;
    } catch (error) {
      console.error(`Erro ao deletar grupo ${groupId}:`, error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateGroupDetails = createAsyncThunk(
  'groups/updateGroupDetails',
  async ({ groupId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/groups/${groupId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar grupo ${groupId}:`, error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  allGroups: [],
  activeGroupId: null,
  status: 'idle',
  error: null,
};

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setActiveGroup: (state, action) => {
      state.activeGroupId = action.payload;
    },
    groupUpdatedLocally: (state, action) => {},
    clearGroupState: (state) => {
      state.allGroups = [];
      state.activeGroupId = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allGroups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteGroup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        const deletedGroupId = action.payload;
        state.allGroups = state.allGroups.filter(g => g.id !== deletedGroupId);
        if (state.activeGroupId === deletedGroupId) {
          state.activeGroupId = null;
        }
        state.status = 'succeeded';
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateGroupDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateGroupDetails.fulfilled, (state, action) => {
        const updatedGroup = action.payload;
        const index = state.allGroups.findIndex(g => g.id === updatedGroup.id);
        if (index !== -1) {
          state.allGroups[index] = updatedGroup;
        }
        state.status = 'succeeded';
      })
      .addCase(updateGroupDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const {
  setActiveGroup,
  groupUpdatedLocally,
  clearGroupState,
} = groupSlice.actions;

export default groupSlice.reducer;

export const selectAllGroups = (state) => state.groups.allGroups;
export const selectGroupStatus = (state) => state.groups.status;
export const selectActiveGroupId = (state) => state.groups.activeGroupId;