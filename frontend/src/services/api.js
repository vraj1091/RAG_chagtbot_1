import axios from 'axios';

// Determine the API base URL
// Priority: VITE_API_URL env var > production backend URL > local fallback
const getBaseURL = () => {
    // If VITE_API_URL is set (from Render env vars at build time), use it
    if (import.meta.env.VITE_API_URL) {
        const url = import.meta.env.VITE_API_URL;
        // Ensure it ends with /api
        return url.endsWith('/api') ? url : `${url}/api`;
    }

    // In production (on Render), use the actual backend URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        return 'https://rag-chatbot-api-ljjp.onrender.com/api';
    }

    // Local development fallback (uses Vite proxy)
    return '/api';
};

// Create axios instance
const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Token is already set in auth store
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth state on 401
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
