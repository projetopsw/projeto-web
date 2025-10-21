// redux/grupoSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api'; 

// ------------------------------------
// 1. ASYNC THUNKS (Para chamadas de API)
// ------------------------------------

// Thunk para buscar todos os grupos
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

// Thunk para deletar um grupo (ESTA É A EXPORTAÇÃO QUE ESTAVA FALTANDO)
// ESPERA: groupId: <ID>
export const deleteGroup = createAsyncThunk(
    'groups/deleteGroup',
    async (groupId, { rejectWithValue }) => {
      try {
        await api.delete(`/groups/${groupId}`);
        return groupId; // Retorna o ID para o reducer saber qual remover
      } catch (error) {
        console.error(`Erro ao deletar grupo ${groupId}:`, error);
        return rejectWithValue(error.response?.data || error.message);
      }
    }
);

// Thunk para editar/atualizar um grupo (ex: nome, descrição, cover)
// ESPERA: { groupId: <ID>, data: { name: 'novo', description: 'nova' } }
export const updateGroupDetails = createAsyncThunk(
    'groups/updateGroupDetails',
    async ({ groupId, data }, { rejectWithValue }) => {
      try {
        const response = await api.patch(`/groups/${groupId}`, data); 
        return response.data; // Retorna o grupo completo atualizado
      } catch (error) {
        console.error(`Erro ao atualizar grupo ${groupId}:`, error);
        return rejectWithValue(error.response?.data || error.message);
      }
    }
);


// ------------------------------------
// 2. SLICE e REDUCERS
// ------------------------------------

const initialState = {
    allGroups: [], // Lista de grupos
    activeGroupId: null, // ID do grupo atualmente selecionado
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
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
            // Lógica para atualizações síncronas se necessário
        },
        clearGroupState: (state) => {
            state.allGroups = [];
            state.activeGroupId = null;
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // --- fetchGroups (GET) ---
            .addCase(fetchGroups.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchGroups.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.allGroups = action.payload; // Assume que a API retorna um array de grupos
            })
            .addCase(fetchGroups.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // --- deleteGroup (DELETE) ---
            .addCase(deleteGroup.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteGroup.fulfilled, (state, action) => {
                const deletedGroupId = action.payload;
                // Remove o grupo da lista
                state.allGroups = state.allGroups.filter(g => g.id !== deletedGroupId);
                // Reseta o grupo ativo se for o que foi deletado
                if (state.activeGroupId === deletedGroupId) {
                    state.activeGroupId = null;
                }
                state.status = 'succeeded';
            })
            .addCase(deleteGroup.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // --- updateGroupDetails (PATCH) ---
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

// ------------------------------------
// 3. EXPORTS SÍNCRONOS (Actions criadas pelo createSlice)
// ------------------------------------

export const { 
    setActiveGroup, 
    groupUpdatedLocally,
    clearGroupState
} = groupSlice.actions;

// ------------------------------------
// 4. EXPORTS PRINCIPAIS
// ------------------------------------

// Exporta o reducer para ser usado no store
export default groupSlice.reducer;

// ------------------------------------
// 5. SELECTORS (Funções para acessar partes do estado)
// ------------------------------------

export const selectAllGroups = (state) => state.groups.allGroups;
export const selectGroupStatus = (state) => state.groups.status;
export const selectActiveGroupId = (state) => state.groups.activeGroupId;