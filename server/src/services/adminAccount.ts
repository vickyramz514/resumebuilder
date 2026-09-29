import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { hashPassword } from '../utils/password.js';

export async function ensureAdminAccount() {
  const email = env.adminEmail;
  const password = env.adminPassword;
  if (!email || !password) {
    console.warn('Admin account was not created. Set ADMIN_EMAIL and ADMIN_PASSWORD on the API host.');
    return;
  }
  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'ADMIN', plan: 'ULTRA', planExpiresAt: null, passwordHash }
    });
    return;
  }
  await prisma.user.create({
    data: {
      name: 'Admin',
      email,
      passwordHash,
      provider: 'password',
      role: 'ADMIN',
      plan: 'ULTRA'
    }
  });
}
