import { apiRequest } from './api';

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  credits: number;
  creditsPerMonth?: number | null;
  billingCycle?: string | null;
  features?: unknown;
  adminOnly?: boolean;
  sortOrder?: number;
  metadata?: { offerBadge?: string | null; compareAtCents?: number; offerNote?: string; popular?: boolean; unlocksAtPaid?: string[] } | null;
  checkoutAvailable?: boolean;
};

export type UserSubscription = {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  externalId: string | null;
  plan: Pick<SubscriptionPlan, 'id' | 'name' | 'slug' | 'credits' | 'creditsPerMonth' | 'priceCents' | 'billingCycle' | 'currency'>;
};

export const listPlans = () => apiRequest<{ success: boolean; data: { plans: SubscriptionPlan[] } }>('/api/subscriptions/plans').then((body) => body.data.plans);
export const getSubscriptionStatus = () => apiRequest<{ success: boolean; data: { subscription: UserSubscription | null } }>('/api/subscriptions/status').then((body) => body.data.subscription);
export const createSubscription = (planSlug: string) =>
  apiRequest<{ success: boolean; data: { subscriptionId: string; checkoutUrl: string; razorpayKeyId: string | null; planId: string; planSlug: string } }>(
    '/api/subscriptions/create',
    { method: 'POST', body: JSON.stringify({ planSlug }) }
  ).then((body) => body.data);
export const confirmSubscription = (subscriptionId: string) =>
  apiRequest<{ success: boolean; data: { subscription: UserSubscription | null; user: { id: string; name: string; email: string; plan: string; planExpiresAt: string | null } } }>(
    '/api/subscriptions/confirm',
    { method: 'POST', body: JSON.stringify({ subscriptionId }) }
  ).then((body) => body.data);
export const cancelSubscription = (subscriptionId: string) =>
  apiRequest<{ success: boolean; data: { message: string } }>('/api/subscriptions/cancel', { method: 'POST', body: JSON.stringify({ subscriptionId }) });
