import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

function utcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

router.get('/overview', async (_req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const chartStart = new Date(now);
    chartStart.setUTCDate(chartStart.getUTCDate() - 13);
    chartStart.setUTCHours(0, 0, 0, 0);

    const [
      users,
      resumes,
      signupsWeek,
      signupsMonth,
      plans,
      activeSubscriptions,
      completedPayments,
      failedPayments,
      pendingPayments,
      recentUsers,
      recentPayments,
      chartSignups
    ] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.groupBy({ by: ['plan'], _count: { _all: true } }),
      prisma.userSubscription.count({ where: { status: 'ACTIVE', currentPeriodEnd: { gt: now } } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _count: { _all: true }, _sum: { amountCents: true } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          role: true,
          provider: true,
          createdAt: true,
          _count: { select: { resumes: true, payments: true } }
        }
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          amountCents: true,
          currency: true,
          status: true,
          provider: true,
          createdAt: true,
          user: { select: { name: true, email: true } }
        }
      }),
      prisma.user.findMany({ where: { createdAt: { gte: chartStart } }, select: { createdAt: true } })
    ]);

    const counts = new Map<string, number>();
    for (const signup of chartSignups) {
      const key = utcDay(signup.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const signups = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(chartStart);
      date.setUTCDate(chartStart.getUTCDate() + index);
      const day = utcDay(date);
      return { day, count: counts.get(day) ?? 0 };
    });

    return res.json({
      totals: {
        users,
        resumes,
        signupsWeek,
        signupsMonth,
        activeSubscriptions,
        completedPayments: completedPayments._count._all,
        revenueCents: completedPayments._sum.amountCents ?? 0,
        failedPayments,
        pendingPayments
      },
      plans: plans.map((row) => ({ plan: row.plan, count: row._count._all })),
      signups,
      users: recentUsers,
      payments: recentPayments
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
