import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

const router = Router();
const publicUser = (user: { id: string; name: string; email: string }) => ({ id: user.id, name: user.name, email: user.email });
const registerSchema = z.object({ name: z.string().trim().min(2), email: z.string().trim().toLowerCase().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

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
    if (!user || !(await comparePassword(values.password, user.passwordHash))) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    return res.json({ user: publicUser(user), token: signToken({ userId: user.id, email: user.email }) });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, name: true, email: true } });
    if (!user) return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } });
    return res.json({ user });
  } catch (error) { return next(error); }
});

export default router;
