import { createSlice } from '@reduxjs/toolkit';

// sessionStorage is tab-scoped, so each tab can hold an independent login session.
// This allows testing broker and customer flows simultaneously in separate tabs.

// Clean up any stale data that may have been written to localStorage by older versions.
localStorage.removeItem('token');
localStorage.removeItem('user');

const storedUser = JSON.parse(sessionStorage.getItem('user'));
const storedToken = sessionStorage.getItem('token');
const storedRefreshToken = sessionStorage.getItem('refreshToken');

const initialState = {
    user: storedUser || null,
    token: storedToken || null,
    refreshToken: storedRefreshToken || null,
    isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, refreshToken } = action.payload;
            state.user = user;
            state.token = token;
            state.refreshToken = refreshToken ?? null;
            state.isAuthenticated = true;
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
            if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
        },
        // Used by the api.js interceptor to silently rotate tokens without touching user state
        updateTokens: (state, action) => {
            const { token, refreshToken } = action.payload;
            state.token = token;
            state.refreshToken = refreshToken ?? state.refreshToken;
            sessionStorage.setItem('token', token);
            if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
        },
    },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;