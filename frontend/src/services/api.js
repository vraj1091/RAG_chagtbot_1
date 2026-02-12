import axios from 'axios';

// Determine the API base URL - Updated 2026-02-12
const getBaseURL = () => {
    // In production on Render, always use the absolute backend URL
    // Try both possible URLs (1jjp with number 1, and ljjp with lowercase L)
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        // Use the correct production URL with number 1 (1jjp)
        return 'https://rag-chatbot-api-1jjp.onrender.com/api';
    }

    // Local development - use localhost backend directly
    return 'http://localhost:8000/api';
};

// Create axios instance with a placeholder baseURL
// The actual URL will be determined at runtime via the request interceptor
const api = axios.create({
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Determine baseURL at runtime (not build time)
        if (!config.baseURL) {
            config.baseURL = getBaseURL();
        }
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
        // Only redirect on 401 if it's NOT an auth request (login/register)
        // Auth endpoints return 401 for invalid credentials - we want those errors
        // to propagate to the component so it can show the error message
        const requestUrl = error.config?.url || '';
        const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

        if (error.response?.status === 401 && !isAuthRequest) {
            // Clear auth state on 401 for non-auth requests (expired token, etc.)
            localStorage.removeItem('auth-storage');
            // Use a softer redirect that doesn't cause full page reload
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
