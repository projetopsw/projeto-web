import { createSlice } from '@reduxjs/toolkit';

import { 
    toggleLikeSongAsync, 
    toggleFollowArtistAsync
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
            const finalUsername = payload.username || payload.name || (state.user ? state.user.username : undefined);
            
            let updatedUser = { 
                ...state.user, 
                ...payload, 
                name: finalUsername,
                id: payloadId || (state.user ? state.user.id : undefined),
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