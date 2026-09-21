import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../services/authApi';

export interface AuthUser { id: string; name: string; email: string; provider?: string; avatar?: string | null }
interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(persist((set) => ({
  user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try { const result = await authApi.login({ email, password }); localStorage.setItem('resumeforge_token', result.token); set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false }); }
    catch (error) { set({ isLoading: false, error: error instanceof Error ? error.message : 'Unable to sign in' }); throw error; }
  },
  loginWithGoogle: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.loginWithGoogle(credential);
      localStorage.setItem('resumeforge_token', result.token);
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unable to sign in with Google' });
      throw error;
    }
  },
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try { const result = await authApi.register({ name, email, password }); localStorage.setItem('resumeforge_token', result.token); set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false }); }
    catch (error) { set({ isLoading: false, error: error instanceof Error ? error.message : 'Unable to create account' }); throw error; }
  },
  logout: () => { localStorage.removeItem('resumeforge_token'); set({ user: null, token: null, isAuthenticated: false, isLoading: false }); },
  loadCurrentUser: async () => {
    if (!localStorage.getItem('resumeforge_token')) return;
    set({ isLoading: true });
    try { const result = await authApi.currentUser(); set({ user: result.user, isAuthenticated: true, isLoading: false }); }
    catch { localStorage.removeItem('resumeforge_token'); set({ user: null, token: null, isAuthenticated: false, isLoading: false }); }
  }
}), { name: 'resumeforge_auth', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }));

window.addEventListener('resumeforge:unauthorized', () => useAuthStore.getState().logout());
