/* src/features/auth/authSlice.js */
import { createSlice } from '@reduxjs/toolkit';

const initialState = { token: null, ActorId: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      if (Object.prototype.hasOwnProperty.call(payload, 'accessToken')) {
        state.token = payload.accessToken;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'ActorId')) {
        state.ActorId = payload.ActorId;
      }
    },
    logOut: () => initialState,
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export const selectCurrentToken = (s) => s.auth.token;
export const selectCurrentId    = (s) => s.auth.ActorId;
export default authSlice.reducer;
