import { createSlice } from '@reduxjs/toolkit';

import { 
    toggleLikeSongAsync, 
    toggleFollowArtistAsync,
    loginUserAsync, 
    handleSpotifyCallback 
} from './loginSlice'; 

const LOCAL_STORAGE_KEY = 'loggedUser';

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

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action) => {
            const serverUser = action.payload;

            const finalId = serverUser._id || serverUser.id;
            const tokenToUse = serverUser.token || (state.user ? state.user.token : null);

            let finalUser = {
                ...serverUser,
                _id: finalId,
                id: finalId,
                username: serverUser.username || serverUser.name,
                name: serverUser.username || serverUser.name,
                token: tokenToUse,
            };
            
            state.user = finalUser;
            saveUserToStorage(finalUser);
        },

        updateProfile: (state, action) => {
            const payload = action.payload;
            
            const currentId = state.user?._id || state.user?.id;
            const payloadId = payload._id || payload.id;
            
            const finalUsername = payload.username || payload.name || (state.user ? state.user.username : undefined);
            
            let updatedUser = { 
                ...state.user, 
                ...payload, 
                _id: payloadId || currentId,
                id: payloadId || currentId,
                name: finalUsername,
                username: finalUsername,
            };

            const newImage = payload.img || payload.image;
            
            if (newImage) {
                updatedUser.img = newImage;
                updatedUser.image = newImage;
            } else if (updatedUser.img === undefined && state.user && state.user.img !== undefined) {
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
    extraReducers: (builder) => {
        
        builder.addCase(loginUserAsync.fulfilled, (state, action) => {
            // O thunk retorna { userWithToken }
            const userWithToken = action.payload?.userWithToken;
            if (userWithToken) {
                userSlice.caseReducers.setUserData(state, { payload: userWithToken });
            }
        });

        builder.addCase(handleSpotifyCallback.fulfilled, (state, action) => {
            // O thunk retorna apenas { token } e já despacha setUserData com o usuário completo antes.
            // Nada adicional é necessário aqui.
        });

        builder.addCase(toggleLikeSongAsync.fulfilled, (state, action) => {
            if (state.user) {
                state.user.likedSongs = action.payload; 
                saveUserToStorage(state.user); 
            }
        });

        builder.addCase(toggleFollowArtistAsync.fulfilled, (state, action) => {
            if (state.user) {
                state.user.following = action.payload; 
                saveUserToStorage(state.user); 
            }
        });
    },
});

export const { setUserData, updateProfile, logoutUser } = userSlice.actions;
export default userSlice.reducer;