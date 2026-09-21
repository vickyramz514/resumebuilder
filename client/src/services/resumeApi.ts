import type { Resume } from '../types';
import { apiRequest } from './api';

export type CloudResume = { id: string; userId?: string; title: string; data: Resume; templateId: string; isPublic: boolean; publicSlug?: string | null; createdAt: string; updatedAt: string };
export const listResumes = () => apiRequest<{ resumes: CloudResume[] }>('/api/resumes');
export const getResume = (id: string) => apiRequest<{ resume: CloudResume }>(`/api/resumes/${id}`);
export const createResume = (data?: Partial<{ title: string; data: Resume; templateId: string }>) => apiRequest<{ resume: CloudResume }>('/api/resumes', { method: 'POST', body: JSON.stringify(data ?? {}) });
export const updateResume = (id: string, data: Partial<{ title: string; data: Resume; templateId: string }>) => apiRequest<{ resume: CloudResume }>(`/api/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteResume = (id: string) => apiRequest<void>(`/api/resumes/${id}`, { method: 'DELETE' });
export const duplicateResume = (id: string) => apiRequest<{ resume: CloudResume }>(`/api/resumes/${id}/duplicate`, { method: 'POST' });
export const renameResume = (id: string, title: string) => apiRequest<{ resume: CloudResume }>(`/api/resumes/${id}/title`, { method: 'PATCH', body: JSON.stringify({ title }) });
export const shareResume = (id: string, isPublic: boolean) => apiRequest<{ resume: CloudResume }>(`/api/resumes/${id}/share`, { method: 'POST', body: JSON.stringify({ isPublic }) });
