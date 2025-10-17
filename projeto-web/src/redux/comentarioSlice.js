import { createSlice } from '@reduxjs/toolkit';

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialState = {};

export const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    addComment: (state, action) => {
      const { musicaId, texto } = action.payload;

      if (!state[musicaId]) {
        state[musicaId] = [];
      }

      const novoCom = {
        id: generateId(),
        texto: texto.trim(),
        autor: 'Você (Anônimo)', 
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').substring(0, 5),
      };

      state[musicaId].unshift(novoCom);
      
    },
  },
});

export const { addComment } = commentsSlice.actions;

export default commentsSlice.reducer;