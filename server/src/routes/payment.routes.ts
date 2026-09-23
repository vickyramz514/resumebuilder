import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { mapPlanSlugToUserPlan } from '../services/billing.shared.js';
import { verifyWebhookSignature } from '../services/razorpay.service.js';
import {
  activateSubscriptionFromRazorpayEntity,
} from '../services/subscriptionActivation.service.js';

type RazorpayEntity = {
  id?: string;
  plan_id?: string;
  status?: string;
  current_start?: number;
  current_end?: number;
  notes?: Record<string, unknown>;
  amount?: number;
};

function entityFrom(payload: Record<string, unknown> | undefined, key: string) {
  const wrapped = payload?.[key] as { entity?: RazorpayEntity } | RazorpayEntity | undefined;
  if (wrapped && typeof wrapped === 'object' && 'entity' in wrapped) return wrapped.entity;
  return wrapped as RazorpayEntity | undefined;
}

export async function handleRazorpayWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : '';
    if (!rawBody || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Invalid webhook' });
    }
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody) as { event?: string; payload?: Record<string, unknown> };
    const eventType = event.event || '';
    const payload = event.payload || {};

    if (eventType === 'subscription.activated') {
      const subscription = entityFrom(payload, 'subscription');
      if (subscription) await activateSubscriptionFromRazorpayEntity(subscription);
    } else if (eventType === 'subscription.charged') {
      await handleSubscriptionCharged(payload);
    } else if (eventType === 'subscription.cancelled') {
      await handleSubscriptionCancelled(payload);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return next(error);
  }
}

async function handleSubscriptionCharged(payload: Record<string, unknown>) {
  const subscription = entityFrom(payload, 'subscription');
  const payment = entityFrom(payload, 'payment');
  if (!subscription?.id || !payment?.id) return;

  const existing = await prisma.payment.findFirst({
    where: { providerId: payment.id, provider: 'RAZORPAY' }
  });
  if (existing) return;

  let userSub = await prisma.userSubscription.findFirst({
    where: { externalId: subscription.id },
    include: { plan: true }
  });
  if (!userSub) {
    await activateSubscriptionFromRazorpayEntity(subscription);
    userSub = await prisma.userSubscription.findFirst({
      where: { externalId: subscription.id },
      include: { plan: true }
    });
  }
  if (!userSub) return;

  const currentStart = subscription.current_start ? new Date(subscription.current_start * 1000) : userSub.currentPeriodStart;
  const currentEnd = subscription.current_end ? new Date(subscription.current_end * 1000) : userSub.currentPeriodEnd;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: userSub.userId,
        amountCents: payment.amount || 0,
        currency: 'INR',
        status: 'COMPLETED',
        provider: 'RAZORPAY',
        providerId: payment.id,
        subscriptionId: subscription.id,
        providerData: JSON.parse(JSON.stringify({ subscription, payment }))
      }
    }),
    prisma.userSubscription.update({
      where: { id: userSub.id },
      data: { currentPeriodStart: currentStart, currentPeriodEnd: currentEnd, status: 'ACTIVE' }
    }),
    prisma.user.update({
      where: { id: userSub.userId },
      data: { plan: mapPlanSlugToUserPlan(userSub.plan.slug), planExpiresAt: currentEnd }
    })
  ]);
}

async function handleSubscriptionCancelled(payload: Record<string, unknown>) {
  const subscription = entityFrom(payload, 'subscription');
  if (!subscription?.id) return;
  const subs = await prisma.userSubscription.findMany({ where: { externalId: subscription.id } });
  await prisma.userSubscription.updateMany({
    where: { externalId: subscription.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelAtPeriodEnd: false }
  });
  for (const row of subs) {
    const otherActive = await prisma.userSubscription.findFirst({
      where: { userId: row.userId, status: 'ACTIVE', externalId: { not: subscription.id } },
      include: { plan: true }
    });
    await prisma.user.update({
      where: { id: row.userId },
      data: otherActive
        ? { plan: mapPlanSlugToUserPlan(otherActive.plan.slug), planExpiresAt: otherActive.currentPeriodEnd }
        : { plan: 'FREE', planExpiresAt: null }
    });
  }
}

export function handleRazorpayCallback(req: Request, res: Response) {
  const source = { ...(req.body as Record<string, string>), ...(req.query as Record<string, string>) };
  const billingUrl = new URL('/billing', env.clientUrl);
  const mapping: Record<string, string> = {
    razorpay_payment_id: 'razorpay_payment_id',
    razorpay_subscription_id: 'razorpay_subscription_id',
    razorpay_order_id: 'razorpay_order_id',
    razorpay_signature: 'razorpay_signature',
    'error[code]': 'payment_error',
    'error[description]': 'payment_error_description'
  };
  for (const [from, to] of Object.entries(mapping)) {
    const value = source[from];
    if (typeof value === 'string' && value) billingUrl.searchParams.set(to, value);
  }
  return res.redirect(303, billingUrl.toString());
}
