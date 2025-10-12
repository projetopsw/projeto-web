import { createSlice } from '@reduxjs/toolkit';

// --- FUNÇÕES DE PERSISTÊNCIA ---

// 1. Tenta carregar o usuário do localStorage na inicialização
const loadUserFromStorage = () => {
    try {
        // Use uma chave única para o usuário logado
        const serializedUser = localStorage.getItem('loggedUser'); 
        if (serializedUser === null) {
            return null;
        }
        return JSON.parse(serializedUser); 
    } catch (e) {
        console.warn("Não foi possível carregar o usuário do localStorage:", e);
        return null;
    }
};

// 2. Função auxiliar para salvar o usuário no localStorage
const saveUserToStorage = (user) => {
    try {
        const serializedUser = JSON.stringify(user);
        localStorage.setItem('loggedUser', serializedUser);
    } catch (e) {
        console.error("Não foi possível salvar o usuário no localStorage:", e);
    }
};

// --- SLICE DO REDUX ---

const initialState = {
    // CORREÇÃO: Carrega o usuário do localStorage como estado inicial
    user: loadUserFromStorage(), 
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action) => {
            state.user = action.payload;
            // AÇÃO: Salva no localStorage sempre que o usuário loga
            saveUserToStorage(action.payload);
        },
        updateProfile: (state, action) => {
            if (state.user) {
                // Atualiza o estado
                state.user = { ...state.user, ...action.payload };
                // AÇÃO: Salva a atualização no localStorage
                saveUserToStorage(state.user);
            }
        },
        // Ação para logout (limpa o estado e o localStorage)
        logoutUser: (state) => {
            state.user = null;
            localStorage.removeItem('loggedUser');
        }
    },
});

export const { setUserData, updateProfile, logoutUser } = userSlice.actions;
export default userSlice.reducer;