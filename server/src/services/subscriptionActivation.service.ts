import { prisma } from '../db.js';
import { mapPlanSlugToUserPlan } from './billing.shared.js';
import { fetchSubscription } from './razorpay.service.js';
import { resolvePlanSlugByRazorpayId } from './razorpayPlanResolver.js';

type RazorpaySubscription = {
  id?: string;
  plan_id?: string;
  status?: string;
  current_start?: number;
  current_end?: number;
  notes?: Record<string, unknown>;
};

function readUserIdFromNotes(notes?: Record<string, unknown>) {
  const raw = notes?.user_id ?? notes?.userId;
  return raw ? String(raw) : null;
}

function periodDates(subscription: RazorpaySubscription) {
  const currentStart = subscription.current_start ? new Date(subscription.current_start * 1000) : new Date();
  const currentEnd = subscription.current_end
    ? new Date(subscription.current_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { currentStart, currentEnd };
}

export async function findSubscriptionPlanByRazorpayId(razorpayPlanId?: string) {
  const id = String(razorpayPlanId || '').trim();
  if (!id) return null;
  const slug = resolvePlanSlugByRazorpayId(id);
  if (slug) {
    const bySlug = await prisma.subscriptionPlan.findFirst({ where: { slug, isActive: true } });
    if (bySlug) return bySlug;
  }
  return prisma.subscriptionPlan.findFirst({ where: { razorpayPlanId: id } });
}

export async function activateSubscriptionFromRazorpayEntity(subscription: RazorpaySubscription) {
  if (!subscription?.id) return { ok: false as const, reason: 'missing_subscription' };
  const plan = await findSubscriptionPlanByRazorpayId(subscription.plan_id);
  if (!plan) return { ok: false as const, reason: 'plan_not_found', planId: subscription.plan_id };
  const userId = readUserIdFromNotes(subscription.notes);
  if (!userId) return { ok: false as const, reason: 'missing_user_id' };
  const { currentStart, currentEnd } = periodDates(subscription);

  await prisma.$transaction([
    prisma.userSubscription.upsert({
      where: { userId_planId: { userId, planId: plan.id } },
      create: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: currentStart,
        currentPeriodEnd: currentEnd,
        externalId: subscription.id
      },
      update: {
        status: 'ACTIVE',
        currentPeriodStart: currentStart,
        currentPeriodEnd: currentEnd,
        externalId: subscription.id,
        cancelledAt: null,
        cancelAtPeriodEnd: false
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: mapPlanSlugToUserPlan(plan.slug), planExpiresAt: currentEnd }
    })
  ]);

  return { ok: true as const, userId, planSlug: plan.slug };
}

export async function confirmSubscriptionForUser(razorpaySubId: string, expectedUserId: string) {
  const subscription = await fetchSubscription(razorpaySubId) as RazorpaySubscription;
  const notesUserId = readUserIdFromNotes(subscription.notes);
  if (notesUserId && notesUserId !== expectedUserId) return { ok: false as const, reason: 'user_mismatch' };
  const status = String(subscription.status || '').toLowerCase();
  if (!['active', 'authenticated', 'created'].includes(status)) {
    return { ok: false as const, reason: 'subscription_not_active' };
  }
  if (!subscription.notes?.user_id) {
    subscription.notes = { ...(subscription.notes || {}), user_id: expectedUserId };
  }
  return activateSubscriptionFromRazorpayEntity(subscription);
}
