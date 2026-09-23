import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../config/env.js';

const starterPlanId = () => env.razorpay.starterPlanId;
const ACTIVE_SLUGS = ['free', 'starter'];

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
  }
];

export async function ensureBillingPlans() {
  for (const plan of defaultBillingPlans) {
    const razorpayPlanId = plan.slug === 'starter' ? starterPlanId() : plan.razorpayPlanId;
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: { ...plan, razorpayPlanId, isActive: true },
      create: { ...plan, razorpayPlanId }
    });
  }
  await prisma.subscriptionPlan.updateMany({
    where: { slug: { notIn: ACTIVE_SLUGS } },
    data: { isActive: false }
  });
}
