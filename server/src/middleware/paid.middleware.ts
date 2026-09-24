import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db.js';

const PAID_PLANS = new Set(['STARTER', 'PRO', 'ULTRA']);

export async function requirePaidPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { plan: true, planExpiresAt: true }
    });
    const active = await prisma.userSubscription.findFirst({
      where: { userId: req.user!.userId, status: 'ACTIVE' }
    });
    const entitled = Boolean(active) || (user && PAID_PLANS.has(user.plan) && (!user.planExpiresAt || user.planExpiresAt > new Date()));
    if (!entitled) {
      return res.status(402).json({
        error: {
          code: 'PAYWALL',
          message: 'AI writing is included on Starter and Pro. Upgrade in Billing to generate suggestions.'
        }
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
