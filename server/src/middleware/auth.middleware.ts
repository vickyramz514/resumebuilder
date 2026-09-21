import type { NextFunction, Request, Response } from 'express';
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
