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
        if (serializedUser === null || serializedUser === 'undefined' || serializedUser === 'null') { 
            return null;
        }
        const user = JSON.parse(serializedUser);
        
        if (!user || (!user.id && !user._id)) {
            localStorage.removeItem(LOCAL_STORAGE_KEY); 
            return null;
        }
        return user;
    } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
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
    status: loadUserFromStorage() ? 'succeeded' : 'idle',
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action) => {
            const serverUser = action.payload;

            if (!serverUser || (Object.keys(serverUser).length === 0 && !state.user)) {
                state.status = 'succeeded';
                state.error = null;
                return;
            }
            
            const existingToken = state.user ? state.user.token : null;
            const finalId = serverUser._id || serverUser.id || state.user?._id || state.user?.id;

            let finalUser = {
                ...state.user, 
                ...serverUser,
                _id: finalId, 
                id: finalId, 
                token: serverUser.token || existingToken, 
                username: serverUser.username || serverUser.name || state.user?.username,
                name: serverUser.name || serverUser.username || state.user?.name,
            };
            
            state.user = finalUser;
            saveUserToStorage(finalUser);
            state.status = 'succeeded'; 
            state.error = null;
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
            state.status = 'idle'; 
            state.error = null;
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        },
    },
    extraReducers: (builder) => {
        
        builder.addCase(loginUserAsync.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(loginUserAsync.fulfilled, (state, action) => {
            const userWithToken = action.payload?.userWithToken;
            if (userWithToken) {
                userSlice.caseReducers.setUserData(state, { payload: userWithToken }); 
            } else {
                state.status = 'failed';
                state.error = 'Falha ao receber dados do usuário após o login.';
            }
        });
        builder.addCase(loginUserAsync.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message || 'Erro ao realizar login.';
        });

        builder.addCase(handleSpotifyCallback.fulfilled, (state, action) => {
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