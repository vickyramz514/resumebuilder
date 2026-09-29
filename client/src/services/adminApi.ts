import { apiRequest } from './api';

export interface AdminOverview {
  totals: {
    users: number;
    resumes: number;
    signupsWeek: number;
    signupsMonth: number;
    activeSubscriptions: number;
    completedPayments: number;
    revenueCents: number;
    failedPayments: number;
    pendingPayments: number;
  };
  plans: Array<{ plan: string; count: number }>;
  signups: Array<{ day: string; count: number }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    role: string;
    provider: string;
    createdAt: string;
    _count: { resumes: number; payments: number };
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    provider: string;
    createdAt: string;
    user: { name: string; email: string };
  }>;
}

export const adminOverview = () => apiRequest<AdminOverview>('/api/admin/overview');
