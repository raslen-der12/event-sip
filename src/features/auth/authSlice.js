/* src/features/auth/authSlice.js */
import { createSlice } from '@reduxjs/toolkit';

const initialState = { token: null, ActorId: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.token    = payload.accessToken;
      state.ActorId = payload.ActorId;
    },
    logOut: () => initialState,
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export const selectCurrentToken = (s) => s.auth.token;
export const selectCurrentId    = (s) => s.auth.ActorId;
export default authSlice.reducer;
