import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db.js';

const PAID_PLANS = new Set(['STARTER', 'PRO', 'ULTRA']);

export async function userHasPaidEntitlement(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true }
  });
  const active = await prisma.userSubscription.findFirst({
    where: { userId, status: 'ACTIVE' }
  });
  return Boolean(active) || Boolean(user && PAID_PLANS.has(user.plan) && (!user.planExpiresAt || user.planExpiresAt > new Date()));
}

export async function requirePaidPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const entitled = await userHasPaidEntitlement(req.user!.userId);
    if (!entitled) {
      return res.status(402).json({
        error: {
          code: 'PAYWALL',
          message: 'PDF export and AI writing are included on Starter and Pro. Subscribe to continue.'
        }
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
