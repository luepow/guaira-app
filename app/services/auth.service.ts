import { apiClient } from './api';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  /**
   * Login with phone and password
   */
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    if (response.success && response.data) {
      // Store auth data in localStorage
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },

  /**
   * Logout - clear auth data
   */
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Register new user
   */
  async register(data: { phone: string; email?: string; name?: string; password: string }) {
    return await apiClient.post<LoginResponse>('/auth/register', data);
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(phone: string) {
    return await apiClient.post('/auth/password-reset/request', { phone });
  },

  /**
   * Verify password reset code
   */
  async verifyResetCode(phone: string, code: string) {
    return await apiClient.post('/auth/password-reset/verify', { phone, code });
  },

  /**
   * Reset password with code
   */
  async resetPassword(phone: string, code: string, newPassword: string) {
    return await apiClient.post('/auth/password-reset/confirm', {
      phone,
      code,
      newPassword,
    });
  },

  /**
   * Refresh auth token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });

    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },
};
