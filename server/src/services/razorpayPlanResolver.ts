import { env } from '../config/env.js';
import { inferRazorpayMode } from './billing.shared.js';

function planMap() {
  const mode = inferRazorpayMode();
  const map: Record<string, string> = { starter: env.razorpay.starterPlanId };
  if (env.razorpay.proPlanId) map.pro = env.razorpay.proPlanId;
  return { mode, map };
}

export function resolvePlanId(planSlug: string, fallbackPlanId?: string | null) {
  const slug = String(planSlug || '').toLowerCase().trim();
  const { mode, map } = planMap();
  return { mode, planId: map[slug] || fallbackPlanId || null };
}

export function resolvePlanSlugByRazorpayId(razorpayPlanId: string) {
  const id = String(razorpayPlanId || '').trim();
  if (!id) return null;
  if (id === env.razorpay.starterPlanId) return 'starter';
  if (id === env.razorpay.proPlanId) return 'pro';
  return null;
}
