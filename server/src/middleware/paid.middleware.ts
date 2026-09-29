import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db.js';
import { templateNeedsFullPlan } from '../services/templateAccess.js';

const FULL_SLUGS = new Set(['starter', 'starter-annual', 'pro', 'ultra', 'admin-test']);

export type DownloadTier = 'none' | 'basic' | 'full';

export async function downloadTierForUser(userId: string): Promise<DownloadTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true, role: true }
  });
  if (user?.role === 'ADMIN') return 'full';
  const active = await prisma.userSubscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { plan: { select: { slug: true } } }
  });
  const slug = String(active?.plan.slug || '').toLowerCase();
  if (FULL_SLUGS.has(slug)) return 'full';
  if (slug === 'basic') return 'basic';
  const expired = Boolean(user?.planExpiresAt && user.planExpiresAt <= new Date());
  if (expired) return 'none';
  if (user?.plan === 'STARTER' || user?.plan === 'PRO' || user?.plan === 'ULTRA') return 'full';
  if (user?.plan === 'BASIC') return 'basic';
  return 'none';
}

export async function userHasPaidEntitlement(userId: string) {
  return (await downloadTierForUser(userId)) !== 'none';
}

export async function userHasAiEntitlement(userId: string) {
  return (await downloadTierForUser(userId)) === 'full';
}

export async function templateDownloadBlock(userId: string, templateId: string | null | undefined) {
  const tier = await downloadTierForUser(userId);
  if (tier === 'none') return 'PDF and Word export are included on the ₹100 plan and on Starter.';
  if (tier === 'basic' && templateNeedsFullPlan(templateId)) {
    return 'This layout is included on Starter. The ₹100 plan can download its eight designed layouts and every free layout.';
  }
  return null;
}

export async function requirePaidPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const entitled = await userHasPaidEntitlement(req.user!.userId);
    if (!entitled) {
      return res.status(402).json({
        error: {
          code: 'PAYWALL',
          message: 'PDF and Word export are included on the ₹100 plan and on Starter. Subscribe to continue.'
        }
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireAiPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const entitled = await userHasAiEntitlement(req.user!.userId);
    if (!entitled) {
      return res.status(402).json({
        error: {
          code: 'PAYWALL',
          message: 'The AI assistant is included on Starter and Pro. Subscribe to continue.'
        }
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
