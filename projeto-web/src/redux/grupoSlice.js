import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async Thunk: Criação de Grupo
export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (newGroupData, { rejectWithValue }) => {
    try {
      // O newGroupData deve ter a forma: { name: 'Novo Grupo', creatorId: '1', members: ['1', '2'], ... }
      const response = await api.post('/groups', newGroupData);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async Thunk: Busca de Grupos
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

// Async Thunk: Deleção de Grupo
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

// Async Thunk: Atualização de Detalhes do Grupo
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
    groupUpdatedLocally: (state, action) => {
      // Reducer para atualizações locais rápidas (se necessário)
    },
    clearGroupState: (state) => {
      state.allGroups = [];
      state.activeGroupId = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reducers para createGroup
      .addCase(createGroup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        // Adiciona o grupo recém-criado ao array de grupos
        state.allGroups.push(action.payload);
        state.status = 'succeeded';
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Reducers para fetchGroups
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

      // Reducers para deleteGroup
      .addCase(deleteGroup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        const deletedGroupId = action.payload;
        state.allGroups = state.allGroups.filter((g) => g.id !== deletedGroupId);
        if (state.activeGroupId === deletedGroupId) {
          state.activeGroupId = null;
        }
        state.status = 'succeeded';
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Reducers para updateGroupDetails
      .addCase(updateGroupDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateGroupDetails.fulfilled, (state, action) => {
        const updatedGroup = action.payload;
        const index = state.allGroups.findIndex((g) => g.id === updatedGroup.id);
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

export const { setActiveGroup, groupUpdatedLocally, clearGroupState } = groupSlice.actions;
export default groupSlice.reducer;

// Selectors
export const selectAllGroups = (state) => state.groups.allGroups;
export const selectGroupStatus = (state) => state.groups.status;
export const selectActiveGroupId = (state) => state.groups.activeGroupId;
export const selectGroupById = (state, groupId) => 
  state.groups.allGroups.find((group) => group.id === groupId);