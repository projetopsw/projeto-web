import { createSlice } from '@reduxjs/toolkit';

const LOCAL_STORAGE_KEY = 'loggedUser';

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

const saveUserToStorage = (user) => {
  try {
    const serializedUser = JSON.stringify(user);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedUser);
  } catch (e) {
    console.error("Não foi possível salvar o usuário no localStorage. A Data URL é muito grande?", e);
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
      const localUser = loadUserFromStorage();

      let finalUser = serverUser;

      if (localUser && localUser.id === serverUser.id && localUser.img) {
        if (localUser.img !== serverUser.img) {
          finalUser = { ...serverUser, img: localUser.img };
        }
      }

      state.user = finalUser;
      saveUserToStorage(finalUser);
    },

    updateProfile: (state, action) => {
      if (state.user) {
        const authUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...state.user, ...action.payload, role: authUser?.role };
        state.user = updatedUser;
        saveUserToStorage(state.user);
      }
    },

    logoutUser: (state) => {
      state.user = null;
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    },
  },
});

export const { setUserData, updateProfile, logoutUser } = userSlice.actions;
export default userSlice.reducer;