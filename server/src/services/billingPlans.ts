import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../config/env.js';

const starterPlanId = () => env.razorpay.starterPlanId;

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
    metadata: { unlocksAtPaid: ['AI writing assistant', 'Job-tailored rewrites', 'Priority support'] }
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'AI-assisted resumes for active job searches',
    priceCents: 150000,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: starterPlanId(),
    features: ['Everything in Free', 'Gemini AI assistant', 'Job-description tailoring', 'Email support'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 1,
    metadata: {
      offerBadge: 'Launch price',
      compareAtCents: 200000,
      offerNote: 'Introductory monthly rate — unlock AI writing',
      popular: true
    }
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For growing teams and heavier AI usage',
    priceCents: 250000,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: 'plan_SwfausudpObmnp',
    features: ['Everything in Starter', 'Higher AI usage', 'Priority support'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 2,
    metadata: { popular: false }
  },
  {
    name: 'Ultra',
    slug: 'ultra',
    description: 'High-volume production',
    priceCents: 500000,
    currency: 'INR',
    credits: 0,
    creditsPerMonth: 0,
    billingCycle: 'monthly',
    razorpayPlanId: 'plan_SwfbIF8TLF3IFq',
    features: ['Everything in Pro', 'High-volume AI usage', 'Dedicated onboarding'] as Prisma.InputJsonValue,
    isActive: true,
    adminOnly: false,
    sortOrder: 3,
    metadata: { popular: false }
  }
];

export async function ensureBillingPlans() {
  for (const plan of defaultBillingPlans) {
    const razorpayPlanId = plan.slug === 'starter' ? starterPlanId() : plan.razorpayPlanId;
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: { ...plan, razorpayPlanId },
      create: { ...plan, razorpayPlanId }
    });
  }
}
