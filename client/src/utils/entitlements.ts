const PAID_PLANS = new Set(['BASIC', 'STARTER', 'PRO', 'ULTRA']);
const FULL_PLANS = new Set(['STARTER', 'PRO', 'ULTRA']);

type PlanUser = { plan?: string | null; role?: string | null; planExpiresAt?: string | null } | null | undefined;

function planIsCurrent(user: PlanUser, allowed: Set<string>) {
  if (user?.role === 'ADMIN') return true;
  if (!user?.plan || !allowed.has(user.plan)) return false;
  if (!user.planExpiresAt) return true;
  return new Date(user.planExpiresAt).getTime() > Date.now();
}

export function hasPaidPlan(user?: PlanUser) {
  return planIsCurrent(user, PAID_PLANS);
}

export function hasFullCatalog(user?: PlanUser) {
  return planIsCurrent(user, FULL_PLANS);
}

export function hasAiPlan(user?: PlanUser) {
  return planIsCurrent(user, FULL_PLANS);
}
