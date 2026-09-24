import { env } from '../config/env.js';

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code = 'BILLING_ERROR'
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

export function inferRazorpayMode() {
  const forced = process.env.RAZORPAY_PLAN_RESOLVER_MODE?.trim().toLowerCase();
  if (forced === 'test' || forced === 'live') return forced;
  if (env.razorpay.declaredMode) return env.razorpay.declaredMode;
  if (env.razorpay.mode === 'test' || env.razorpay.mode === 'live') return env.razorpay.mode;
  return process.env.NODE_ENV === 'production' ? 'live' : 'test';
}

export function mapPlanSlugToUserPlan(slug: string): 'FREE' | 'STARTER' | 'PRO' | 'ULTRA' {
  const key = String(slug || '').toLowerCase();
  if (key === 'starter' || key === 'starter-annual' || key === 'admin-test') return 'STARTER';
  if (key === 'pro') return 'PRO';
  if (key === 'ultra') return 'ULTRA';
  return 'FREE';
}
