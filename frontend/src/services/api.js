import axios from 'axios';
import { store } from '../store/index.js';
import { updateTokens, logout } from '../store/features/authSlice.js';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach the token
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- Refresh token rotation state ---
let isRefreshing = false;
// Queue of { resolve, reject } for requests that arrived while a refresh was already in-flight
let pendingQueue = [];

const drainQueue = (error, token = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    pendingQueue = [];
};

// Response Interceptor: attempt token refresh on 401 before logging out
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only act on 401s.  Never retry auth endpoints (avoids infinite loops).
        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes('/auth/')
        ) {
            return Promise.reject(error);
        }

        const refreshToken = sessionStorage.getItem('refreshToken');

        // No refresh token stored — force logout immediately
        if (!refreshToken) {
            store.dispatch(logout());
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // If a refresh is already in-flight, queue this request to retry once it resolves
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            }).catch((queueError) => Promise.reject(queueError));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Use a plain axios call so this request doesn't go through our interceptor again
            const refreshResponse = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                { refreshToken },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;

            // Persist rotated tokens to sessionStorage and Redux
            store.dispatch(updateTokens({ token: newToken, refreshToken: newRefreshToken }));

            // Update the default header for future requests
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

            // Drain the pending queue — all queued requests get the new token
            drainQueue(null, newToken);

            // Retry the original failed request with the fresh access token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            drainQueue(refreshError, null);
            store.dispatch(logout());
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;