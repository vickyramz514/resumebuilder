import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

const slugPart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'resume';

export async function uniqueSlug(title: string) {
  let slug = `${slugPart(title)}-${randomBytes(4).toString('hex')}`;
  while (await prisma.resume.findUnique({ where: { publicSlug: slug } })) slug = `${slugPart(title)}-${randomBytes(4).toString('hex')}`;
  return slug;
}

export const resumeSelect = { id: true, userId: true, title: true, data: true, templateId: true, isPublic: true, publicSlug: true, createdAt: true, updatedAt: true } satisfies Prisma.ResumeSelect;
