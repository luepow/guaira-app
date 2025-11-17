import { create } from 'zustand';
import type { AuthState, User } from '../types';
import { authService } from '../services/auth.service';

interface AuthStore extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem('auth_token');
    set({
      user,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    });
  },

  login: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ phone, password });
      if (response.success && response.data) {
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));
