import { create } from 'zustand';
import api from '../lib/api';
import type { AuthResponse, User } from '../lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateTheme: (color: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    document.documentElement.style.setProperty('--theme-color', data.themeColor);
    set({ token: data.token, isAuthenticated: true, user: { id: data.userId, fullName: data.fullName, email: data.email, themeColor: data.themeColor } });
  },

  register: async (fullName, email, password) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { fullName, email, password });
    localStorage.setItem('token', data.token);
    document.documentElement.style.setProperty('--theme-color', data.themeColor);
    set({ token: data.token, isAuthenticated: true, user: { id: data.userId, fullName: data.fullName, email: data.email, themeColor: data.themeColor } });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false, user: null });
  },

  loadProfile: async () => {
    try {
      const { data } = await api.get<User>('/auth/profile');
      document.documentElement.style.setProperty('--theme-color', data.themeColor);
      set({ user: data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  updateTheme: async (color) => {
    const { data } = await api.put<User>('/auth/theme', JSON.stringify(color), { headers: { 'Content-Type': 'application/json' } });
    document.documentElement.style.setProperty('--theme-color', data.themeColor);
    set((s) => ({ user: s.user ? { ...s.user, themeColor: data.themeColor } : null }));
  },
}));
