import { apiRequest } from './api';
import type { AuthUser } from '../store/authStore';

export const register = (input: { name: string; email: string; password: string }) => apiRequest<{ user: AuthUser; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
export const login = (input: { email: string; password: string }) => apiRequest<{ user: AuthUser; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) });
export const currentUser = () => apiRequest<{ user: AuthUser }>('/api/auth/me');
