import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { BillingError } from '../services/billing.shared.js';
import { cancelSubscription, createSubscription, fetchPlan } from '../services/razorpay.service.js';
import { resolvePlanId } from '../services/razorpayPlanResolver.js';
import { confirmSubscriptionForUser } from '../services/subscriptionActivation.service.js';

const router = Router();
const publicPlanSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  currency: true,
  credits: true,
  creditsPerMonth: true,
  billingCycle: true,
  features: true,
  adminOnly: true,
  sortOrder: true,
  metadata: true,
  razorpayPlanId: true
} as const;

const subscriptionSelect = {
  id: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  externalId: true,
  plan: {
    select: {
      id: true,
      name: true,
      slug: true,
      credits: true,
      creditsPerMonth: true,
      priceCents: true,
      billingCycle: true,
      currency: true
    }
  }
} as const;

async function assertRazorpayPlanPricing(plan: { slug: string; priceCents: number; currency: string }, razorpayPlanId: string, mode: string) {
  let remote;
  try {
    remote = await fetchPlan(razorpayPlanId);
  } catch (error) {
    throw new BillingError(
      `Unable to validate Razorpay plan ${razorpayPlanId} in ${mode} mode. ${error instanceof Error ? error.message : ''}`,
      502,
      'BILLING_PLAN_VALIDATION_FAILED'
    );
  }
  const item = (remote as { item?: { amount?: number; currency?: string } }).item;
  const expectedAmount = Number(plan.priceCents);
  const expectedCurrency = String(plan.currency || 'INR').toUpperCase();
  const actualAmount = Number(item?.amount ?? 0);
  const actualCurrency = String(item?.currency || '').toUpperCase();
  if (actualAmount !== expectedAmount || actualCurrency !== expectedCurrency) {
    await prisma.subscriptionPlan.update({
      where: { slug: plan.slug },
      data: { priceCents: actualAmount, currency: actualCurrency || 'INR' }
    });
    plan.priceCents = actualAmount;
    plan.currency = actualCurrency || 'INR';
  }
}

router.get('/plans', async (_req, res, next) => {
  try {
    const plans = (await prisma.subscriptionPlan.findMany({
      where: { isActive: true, adminOnly: false },
      orderBy: { sortOrder: 'asc' },
      select: publicPlanSelect
    })).filter((plan) => plan.slug !== 'pro' || env.razorpay.proPlanEnabled)
      .filter((plan) => !(String(plan.currency).toUpperCase() === 'INR' && plan.priceCents === 100));
    return res.json({
      success: true,
      data: {
        plans: plans.map(({ razorpayPlanId, ...plan }) => {
          const { planId: mappedId } = resolvePlanId(plan.slug, razorpayPlanId);
          return {
            ...plan,
            checkoutAvailable: plan.priceCents <= 0 || Boolean(mappedId || razorpayPlanId)
          };
        })
      }
    });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId: req.user!.userId, status: 'ACTIVE' },
      include: { plan: { select: subscriptionSelect.plan.select } }
    });
    return res.json({ success: true, data: { subscription: subscription || null } });
  } catch (error) { return next(error); }
});

router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const subscription =
      (await prisma.userSubscription.findFirst({
        where: { userId: req.user!.userId, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        select: subscriptionSelect
      })) ||
      (await prisma.userSubscription.findFirst({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        select: subscriptionSelect
      }));
    return res.json({ success: true, data: { subscription: subscription || null } });
  } catch (error) { return next(error); }
});

router.post('/create', requireAuth, async (req, res, next) => {
  try {
    const { planSlug } = z.object({ planSlug: z.string().trim().min(1) }).parse(req.body ?? {});
    const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: planSlug, isActive: true } });
    if (!plan) throw new BillingError('Plan not found.', 404, 'PLAN_NOT_FOUND');
    if (plan.slug === 'pro' && !env.razorpay.proPlanEnabled) {
      throw new BillingError('This plan is currently unavailable.', 404, 'PLAN_DISABLED');
    }
    if (String(plan.currency).toUpperCase() === 'INR' && plan.priceCents === 100) {
      throw new BillingError('This plan is currently unavailable.', 404, 'PLAN_DISABLED');
    }
    if (plan.adminOnly) throw new BillingError('This plan is only available to admin users', 403, 'FORBIDDEN');
    if (plan.priceCents <= 0) throw new BillingError('Free plan cannot be subscribed', 400, 'FREE_PLAN');
    const { planId: razorpayPlanId, mode } = resolvePlanId(plan.slug, plan.razorpayPlanId);
    if (!razorpayPlanId) {
      throw new BillingError(`Plan not configured for Razorpay (${mode} mode).`, 404, 'PLAN_NOT_CONFIGURED');
    }
    await assertRazorpayPlanPricing(plan, razorpayPlanId, mode);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { email: true } });
    const created = await createSubscription(razorpayPlanId, req.user!.userId, user?.email || null);
    return res.json({
      success: true,
      data: {
        subscriptionId: created.subscriptionId,
        checkoutUrl: created.shortUrl,
        razorpayKeyId: env.razorpay.keyId || null,
        planId: plan.id,
        planSlug: plan.slug
      }
    });
  } catch (error) { return next(error); }
});

router.post('/confirm', requireAuth, async (req, res, next) => {
  try {
    const subscriptionId = String(
      req.body?.subscriptionId || req.body?.razorpaySubscriptionId || req.body?.razorpay_subscription_id || ''
    ).trim();
    if (!subscriptionId) throw new BillingError('subscriptionId is required', 400, 'VALIDATION_ERROR');
    const result = await confirmSubscriptionForUser(subscriptionId, req.user!.userId);
    if (!result.ok) {
      if (result.reason === 'user_mismatch') throw new BillingError('Subscription does not belong to this account', 403, 'FORBIDDEN');
      throw new BillingError(`Could not confirm subscription: ${result.reason}`, 400, 'CONFIRM_FAILED');
    }
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId: req.user!.userId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      select: subscriptionSelect
    });
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, provider: true, avatar: true, plan: true, planExpiresAt: true }
    });
    return res.json({ success: true, data: { subscription, user } });
  } catch (error) { return next(error); }
});

router.post('/cancel', requireAuth, async (req, res, next) => {
  try {
    const { subscriptionId } = z.object({ subscriptionId: z.string().trim().min(1) }).parse(req.body ?? {});
    const userSub = await prisma.userSubscription.findFirst({
      where: { userId: req.user!.userId, externalId: subscriptionId }
    });
    if (!userSub) throw new BillingError('Subscription not found', 404, 'NOT_FOUND');
    await cancelSubscription(subscriptionId);
    await prisma.$transaction([
      prisma.userSubscription.update({
        where: { id: userSub.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelAtPeriodEnd: false }
      }),
      prisma.user.update({
        where: { id: req.user!.userId },
        data: { plan: 'FREE', planExpiresAt: null }
      })
    ]);
    return res.json({ success: true, data: { message: 'Subscription cancelled' } });
  } catch (error) { return next(error); }
});

export default router;
