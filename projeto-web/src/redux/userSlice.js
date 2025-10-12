import { createSlice } from '@reduxjs/toolkit';

// --- FUNÇÕES DE PERSISTÊNCIA ---

const LOCAL_STORAGE_KEY = 'loggedUser';

// 1. Tenta carregar o usuário do localStorage na inicialização
const loadUserFromStorage = () => {
    try {
        const serializedUser = localStorage.getItem(LOCAL_STORAGE_KEY); 
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
        // Tenta salvar o objeto completo (incluindo a Data URL)
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedUser);
    } catch (e) {
        console.error("Não foi possível salvar o usuário no localStorage. A Data URL é muito grande?", e);
    }
};

// --- SLICE DO REDUX ---

const initialState = {
    // Carrega o usuário do localStorage (com a imagem se estiver lá)
    user: loadUserFromStorage(), 
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // Ação de Login/Inicialização de Dados
        setUserData: (state, action) => {
            const serverUser = action.payload; // Usuário vindo do servidor (sem a nova imagem)
            const localUser = loadUserFromStorage(); // Versão do usuário que já estava salva (COM a nova imagem)

            let finalUser = serverUser;
            
            // VERIFICAÇÃO CRÍTICA: Se o ID do usuário é o mesmo E 
            // a imagem do localStorage existe e é diferente da imagem do servidor (ou a do servidor está faltando)
            if (localUser && localUser.id === serverUser.id && localUser.img) {
                 // Prioriza a imagem do localStorage se o servidor falhou em salvá-la
                 if (localUser.img !== serverUser.img) {
                    // Mescla os dados do servidor (novos) com a imagem do localUser (persistente)
                    finalUser = { ...serverUser, img: localUser.img };
                 }
            }
            
            // Se o login for de um usuário novo ou diferente, salva a versão do servidor
            state.user = finalUser;

            // Salva a versão final (com a imagem persistente) no localStorage
            saveUserToStorage(finalUser);
        },
        
        // Ação de Edição (Chamada pelo ProfileEdition.jsx)
        updateProfile: (state, action) => {
            if (state.user) {
                // Junta os dados do servidor (ou o fullUserUpdate que enviamos)
                const updatedUser = { ...state.user, ...action.payload };
                state.user = updatedUser;
                // AÇÃO: Salva a atualização completa no localStorage
                saveUserToStorage(state.user);
            }
        },
        
        // Ação para logout (limpa o estado e o localStorage)
        logoutUser: (state) => {
            state.user = null;
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    },
});

export const { setUserData, updateProfile, logoutUser } = userSlice.actions;
export default userSlice.reducer;