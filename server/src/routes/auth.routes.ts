import { Router } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const router = Router();
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
const publicUser = (user: { id: string; name: string; email: string; provider: string; googleId: string | null; avatar: string | null }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  provider: user.provider,
  avatar: user.avatar
});
const registerSchema = z.object({ name: z.string().trim().min(2), email: z.string().trim().toLowerCase().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
const googleSchema = z.object({
  credential: z.string().trim().min(1).optional(),
  idToken: z.string().trim().min(1).optional()
}).refine((values) => values.credential || values.idToken, { message: 'Google credential is required' });

router.post('/register', async (req, res, next) => {
  try {
    const values = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: values.email } });
    if (existing) return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' } });
    const user = await prisma.user.create({ data: { name: values.name, email: values.email, passwordHash: await hashPassword(values.password) } });
    return res.status(201).json({ user: publicUser(user), token: signToken({ userId: user.id, email: user.email }) });
  } catch (error) { return next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const values = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: values.email } });
    if (!user?.passwordHash || !(await comparePassword(values.password, user.passwordHash))) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    return res.json({ user: publicUser(user), token: signToken({ userId: user.id, email: user.email }) });
  } catch (error) { return next(error); }
});

router.post('/google', async (req, res, next) => {
  try {
    const values = googleSchema.parse(req.body);
    const idToken = values.credential ?? values.idToken!;
    if (!googleClient || !env.googleClientId) {
      return res.status(503).json({ error: { code: 'GOOGLE_NOT_CONFIGURED', message: 'Google sign-in is not configured' } });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Invalid or expired Google token' } });
    }

    if (!payload) {
      return res.status(401).json({ error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Google account could not be verified' } });
    }
    const email = payload.email?.trim().toLowerCase();
    if (!email || payload.email_verified !== true || !payload.sub) {
      return res.status(401).json({ error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Google account could not be verified' } });
    }

    const name = payload.name?.trim() || payload.given_name?.trim() || email.split('@')[0];
    const existingByGoogleId = await prisma.user.findUnique({ where: { googleId: payload.sub } });
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByGoogleId && existingByEmail && existingByGoogleId.id !== existingByEmail.id) {
      return res.status(409).json({ error: { code: 'GOOGLE_ACCOUNT_CONFLICT', message: 'This Google account is linked to another user' } });
    }

    const existing = existingByGoogleId ?? existingByEmail;
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: payload.sub,
            provider: 'google',
            avatar: payload.picture ?? existing.avatar,
            name: existing.name || name
          }
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            passwordHash: null,
            provider: 'google',
            googleId: payload.sub,
            avatar: payload.picture ?? null
          }
        });

    return res.json({ user: publicUser(user), token: signToken({ userId: user.id, email: user.email }) });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, name: true, email: true, provider: true, googleId: true, avatar: true } });
    if (!user) return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } });
    return res.json({ user: publicUser(user) });
  } catch (error) { return next(error); }
});

export default router;
