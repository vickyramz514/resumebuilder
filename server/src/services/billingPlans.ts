import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { fetchPlan } from './razorpay.service.js';

const starterPlanId = () => env.razorpay.starterPlanId;
const proPlanId = () => env.razorpay.proPlanId;
/** Flip `RAZORPAY_PLAN_PRO_ENABLED` (false / disable / 0) to hide Pro without deleting it. */
export const isProPlanEnabled = () => env.razorpay.proPlanEnabled;

function activeSlugs() {
  return isProPlanEnabled() ? ['free', 'starter', 'pro'] : ['free', 'starter'];
}

export const defaultBillingPlans: Prisma.SubscriptionPlanCreateInput[] = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Build and export resumes without a card',
    priceCents: 0,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: null,
    razorpayPlanId: null,
    features: ['12 templates', 'Cloud resume library', 'PDF export', 'Manual editing'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 0,
    metadata: { unlocksAtPaid: ['AI writing assistant', 'Job-tailored rewrites'] }
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'AI-assisted resumes for active job searches',
    priceCents: 65000,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: starterPlanId(),
    features: ['Everything in Free', 'Gemini AI assistant', 'Job-description tailoring'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 1,
    metadata: { popular: true }
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Priority support and extra AI capacity for heavier job searches',
    priceCents: 129900,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: proPlanId(),
    features: ['Everything in Starter', 'Higher AI usage', 'Priority support'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 2,
    metadata: { flag: 'RAZORPAY_PLAN_PRO_ENABLED' }
  }
];

async function razorpayPricing(planId: string | null) {
  if (!planId || !env.razorpay.keyId || !env.razorpay.keySecret) return {};
  try {
    const remote = await fetchPlan(planId) as {
      period?: string;
      item?: { amount?: number; currency?: string };
    };
    const priceCents = Number(remote.item?.amount);
    return {
      ...(Number.isFinite(priceCents) && priceCents > 0 ? { priceCents } : {}),
      ...(remote.item?.currency ? { currency: String(remote.item.currency).toUpperCase() } : {}),
      ...(remote.period ? { billingCycle: remote.period === 'yearly' ? 'yearly' : 'monthly' } : {})
    };
  } catch {
    return {};
  }
}

export async function ensureBillingPlans() {
  for (const plan of defaultBillingPlans) {
    const razorpayPlanId = plan.slug === 'starter'
      ? starterPlanId()
      : plan.slug === 'pro'
        ? proPlanId()
        : plan.razorpayPlanId;
    const isActive = plan.slug !== 'pro' || isProPlanEnabled();
    const remote = await razorpayPricing(razorpayPlanId ?? null);
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: { ...plan, ...remote, razorpayPlanId, isActive },
      create: { ...plan, ...remote, razorpayPlanId, isActive }
    });
  }
  await prisma.subscriptionPlan.updateMany({
    where: { slug: { notIn: activeSlugs() } },
    data: { isActive: false }
  });
}
