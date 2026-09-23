import { ensureBillingPlans } from '../src/services/billingPlans.ts';
import { prisma } from '../src/db.ts';

await ensureBillingPlans();
const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, razorpayPlanId: true, priceCents: true } });
console.log(JSON.stringify(plans, null, 2));
await prisma.$disconnect();
