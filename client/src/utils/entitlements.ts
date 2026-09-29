const PAID_PLANS = new Set(['BASIC', 'STARTER', 'PRO', 'ULTRA']);
const FULL_PLANS = new Set(['STARTER', 'PRO', 'ULTRA']);

const ADMIN_EMAIL = 'admin@careerresume.in';

type PlanUser = { plan?: string | null; role?: string | null; email?: string | null; planExpiresAt?: string | null } | null | undefined;

export function isAdminUser(user?: PlanUser) {
  return user?.role === 'ADMIN' || user?.email?.toLowerCase() === ADMIN_EMAIL;
}

function planIsCurrent(user: PlanUser, allowed: Set<string>) {
  if (isAdminUser(user)) return true;
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
