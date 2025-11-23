import { createSlice } from '@reduxjs/toolkit';

// 💡 IMPORTAÇÃO NECESSÁRIA: Importa os thunks do authSlice para escutar a conclusão deles
import { 
    toggleLikeSongAsync, 
    toggleFollowArtistAsync
} from './loginSlice'; 
// OBS: Certifique-se de que o caminho './loginSlice' está correto em seu projeto.

const LOCAL_STORAGE_KEY = 'loggedUser';

// --- Funções de Persistência (Sem Alteração) ---
const loadUserFromStorage = () => {
    try {
        const serializedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedUser === null) {
            return null;
        }
        return JSON.parse(serializedUser);
    } catch (e) {
        return null;
    }
};

const saveUserToStorage = (user) => {
    try {
        const serializedUser = JSON.stringify(user);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedUser);
    } catch (e) {
    }
};

const initialState = {
    user: loadUserFromStorage(), 
};

// ----------------------------------------------------------------------

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action) => {
            const serverUser = action.payload;

            let finalUser = serverUser;
            
            const finalName = finalUser.username || finalUser.name;
            finalUser.name = finalName;
            finalUser.username = finalName;

            state.user = finalUser;
            saveUserToStorage(finalUser);
        },

        updateProfile: (state, action) => {
            const payload = action.payload;
            const payloadId = payload._id || payload.id;
            const finalUsername = payload.username || payload.name || state.user.username;
            
            let updatedUser = { 
                ...state.user, 
                ...payload, 
                name: finalUsername,
                id: payloadId || state.user.id,
                username: finalUsername,
            };

            const newImage = payload.img || payload.image;
            
            if (newImage) {
                updatedUser.img = newImage;
                updatedUser.image = newImage;
            } else if (updatedUser.img === undefined && state.user.img !== undefined) {
                 updatedUser.img = state.user.img;
            }
            
            state.user = updatedUser;
            
            saveUserToStorage(state.user);
        },

        logoutUser: (state) => {
            state.user = null;
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        },
    },
    // 🚀 NOVO: extraReducers transferidos do authSlice
    extraReducers: (builder) => {
        // --- 1. Atualiza Músicas Curtidas ---
        builder.addCase(toggleLikeSongAsync.fulfilled, (state, action) => {
            if (state.user) {
                // action.payload contém o array 'newLikedSongs'
                state.user.likedSongs = action.payload; 
                saveUserToStorage(state.user); 
            }
        });

        // --- 2. Atualiza Artistas Seguindo ---
        builder.addCase(toggleFollowArtistAsync.fulfilled, (state, action) => {
            if (state.user) {
                // action.payload contém o array 'newFollowing'
                state.user.following = action.payload; 
                saveUserToStorage(state.user); 
            }
        });
    },
});

export const { setUserData, updateProfile, logoutUser } = userSlice.actions;
export default userSlice.reducer;