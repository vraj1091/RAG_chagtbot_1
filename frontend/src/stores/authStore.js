import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Login
            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { access_token, user } = response.data;

                    // Set token in API instance
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    set({
                        user,
                        token: access_token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Login failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            // Register
            register: async (email, username, password, fullName) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', {
                        email,
                        username,
                        password,
                        full_name: fullName,
                    });
                    const { access_token, user } = response.data;

                    // Set token in API instance
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    set({
                        user,
                        token: access_token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Registration failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            // Logout
            logout: () => {
                delete api.defaults.headers.common['Authorization'];
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            // Refresh user data
            refreshUser: async () => {
                const { token } = get();
                if (!token) return;

                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/auth/me');
                    set({ user: response.data });
                } catch (error) {
                    // Token might be expired
                    get().logout();
                }
            },

            // Initialize auth from persisted state
            initializeAuth: () => {
                const { token } = get();
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            },

            // Clear error
            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Re-initialize auth headers after rehydration
                if (state?.token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
            },
        }
    )
);
