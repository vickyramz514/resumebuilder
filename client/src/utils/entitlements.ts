const PAID_PLANS = new Set(['STARTER', 'PRO', 'ULTRA']);

export function hasPaidPlan(user?: { plan?: string | null; planExpiresAt?: string | null } | null) {
  if (!user?.plan || !PAID_PLANS.has(user.plan)) return false;
  if (!user.planExpiresAt) return true;
  return new Date(user.planExpiresAt).getTime() > Date.now();
}
