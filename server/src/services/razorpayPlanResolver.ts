import { env } from '../config/env.js';
import { inferRazorpayMode } from './billing.shared.js';

const LIVE_PLAN_MAP: Record<string, string> = {
  starter: env.razorpay.starterPlanId,
  'starter-annual': 'plan_Td0xEpRepdFo7Z',
  pro: 'plan_SwfausudpObmnp',
  ultra: 'plan_SwfbIF8TLF3IFq'
};

const TEST_PLAN_MAP: Record<string, string> = {
  starter: env.razorpay.starterPlanId,
  pro: 'plan_SwgNeJqb3cx1AL',
  ultra: 'plan_SwgQLQ0k6cg9Gi'
};

function planMap() {
  const mode = inferRazorpayMode();
  return { mode, map: mode === 'live' ? LIVE_PLAN_MAP : TEST_PLAN_MAP };
}

export function resolvePlanId(planSlug: string, fallbackPlanId?: string | null) {
  const slug = String(planSlug || '').toLowerCase().trim();
  const { mode, map } = planMap();
  return { mode, planId: map[slug] || fallbackPlanId || null };
}

export function resolvePlanSlugByRazorpayId(razorpayPlanId: string) {
  const id = String(razorpayPlanId || '').trim();
  if (!id) return null;
  for (const map of [LIVE_PLAN_MAP, TEST_PLAN_MAP]) {
    for (const [slug, mappedId] of Object.entries(map)) {
      if (mappedId && mappedId === id) return slug;
    }
  }
  return null;
}
