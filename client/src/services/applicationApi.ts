import { apiRequest } from './api';

export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'CLOSED';
export type ApplicationSource = 'NAUKRI' | 'LINKEDIN' | 'OTHER';

export type JobApplication = {
  id: string;
  role: string;
  company: string;
  url: string;
  source: ApplicationSource;
  status: ApplicationStatus;
  notes: string;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const listApplications = () => apiRequest<{ applications: JobApplication[] }>('/api/applications');

export const createApplication = (data: { url: string; role?: string; company?: string; notes?: string; status?: ApplicationStatus }) =>
  apiRequest<{ application: JobApplication }>('/api/applications', { method: 'POST', body: JSON.stringify(data) });

export const updateApplication = (id: string, data: Partial<{ url: string; role: string; company: string; notes: string; status: ApplicationStatus }>) =>
  apiRequest<{ application: JobApplication }>(`/api/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteApplication = (id: string) => apiRequest<void>(`/api/applications/${id}`, { method: 'DELETE' });
