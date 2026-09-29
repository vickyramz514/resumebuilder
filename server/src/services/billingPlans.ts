import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { fetchPlan } from './razorpay.service.js';

const basicPlanId = () => env.razorpay.basicPlanId;
const starterPlanId = () => env.razorpay.starterPlanId;
const proPlanId = () => env.razorpay.proPlanId;
/** The ₹1299 plan stays off unless `RAZORPAY_PLAN_PRO_ENABLED` is turned on. Public Pro is slug `starter`. */
export const isProPlanEnabled = () => env.razorpay.proPlanEnabled;

function activeSlugs() {
  return isProPlanEnabled() ? ['free', 'basic', 'starter', 'pro'] : ['free', 'basic', 'starter'];
}

export const defaultBillingPlans: Prisma.SubscriptionPlanCreateInput[] = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Build and edit resumes without a card',
    priceCents: 0,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: null,
    razorpayPlanId: null,
    features: ['21 free templates', 'Cloud resume library', 'Manual editing'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 0,
    metadata: { unlocksAtPaid: ['PDF and Word export', 'AI writing assistant', 'Job-tailored rewrites'] }
  },
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Ten designed layouts, plus PDF and Word, for ₹100 a month',
    priceCents: 10000,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: basicPlanId(),
    features: ['Everything in Free', '10 designed layouts', 'PDF and Word export'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 1,
    metadata: { offerBadge: '₹100' }
  },
  {
    name: 'Pro',
    slug: 'starter',
    description: 'Every layout, PDF and Word, and the AI writing assistant',
    priceCents: 65000,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: starterPlanId(),
    features: ['Everything in Basic', 'The other 19 Pro layouts', 'PDF and Word export', 'Gemini AI assistant', 'Job-description tailoring'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 2,
    metadata: { popular: true }
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'AI-assisted resumes, PDF and Word export, and extra AI capacity',
    priceCents: 129900,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: proPlanId(),
    features: ['Everything in Pro', 'Higher AI usage', 'Priority support'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 3,
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
    const razorpayPlanId = plan.slug === 'basic'
      ? basicPlanId()
      : plan.slug === 'starter'
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
