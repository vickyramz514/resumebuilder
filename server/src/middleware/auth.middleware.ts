import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { verifyToken, type JwtPayload } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } });
  }
  try {
    req.user = verifyToken(header.slice(7));
    return next();
  } catch {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Your session has expired' } });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { role: true, email: true } });
    if (user?.role !== 'ADMIN' && user?.email?.toLowerCase() !== env.adminEmail) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access is required' } });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
