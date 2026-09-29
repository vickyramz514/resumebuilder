import { Router } from 'express';
import { z } from 'zod';
import type { ApplicationSource, ApplicationStatus, Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'CLOSED'] as const;
const applicationSelect = {
  id: true,
  role: true,
  company: true,
  url: true,
  source: true,
  status: true,
  notes: true,
  appliedAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.JobApplicationSelect;

const httpUrl = z.string().trim().min(8).max(2000).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Enter a full job link, starting with https://');

const createSchema = z.object({
  url: httpUrl,
  role: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(STATUSES).optional()
});

const updateSchema = z.object({
  url: httpUrl.optional(),
  role: z.string().trim().min(1).max(120).optional(),
  company: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(STATUSES).optional()
}).refine((value) => Object.keys(value).length > 0, 'Nothing to update');

function sourceFromUrl(url: string): ApplicationSource {
  const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'naukri.com' || host.endsWith('.naukri.com')) return 'NAUKRI';
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'LINKEDIN';
  return 'OTHER';
}

function roleFromInput(role: string | undefined, source: ApplicationSource) {
  const trimmed = role?.trim();
  if (trimmed) return trimmed;
  if (source === 'NAUKRI') return 'Role on Naukri';
  if (source === 'LINKEDIN') return 'Role on LinkedIn';
  return 'Job listing';
}

router.get('/', async (req, res, next) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      select: applicationSelect
    });
    return res.json({ applications });
  } catch (error) { return next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const values = createSchema.parse(req.body ?? {});
    const count = await prisma.jobApplication.count({ where: { userId: req.user!.userId } });
    if (count >= 200) return res.status(400).json({ error: { code: 'APPLICATION_LIMIT', message: 'You can save up to 200 applications.' } });
    const source = sourceFromUrl(values.url);
    const status: ApplicationStatus = values.status ?? 'SAVED';
    const application = await prisma.jobApplication.create({
      data: {
        userId: req.user!.userId,
        role: roleFromInput(values.role, source),
        company: values.company?.trim() ?? '',
        url: values.url,
        source,
        status,
        notes: values.notes?.trim() ?? '',
        appliedAt: status === 'APPLIED' ? new Date() : null
      },
      select: applicationSelect
    });
    return res.status(201).json({ application });
  } catch (error) { return next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const values = updateSchema.parse(req.body ?? {});
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) return res.status(404).json({ error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' } });
    const url = values.url ?? existing.url;
    const status = values.status ?? existing.status;
    const application = await prisma.jobApplication.update({
      where: { id },
      data: {
        url,
        source: sourceFromUrl(url),
        role: values.role?.trim() || existing.role,
        company: values.company !== undefined ? values.company.trim() : existing.company,
        notes: values.notes !== undefined ? values.notes.trim() : existing.notes,
        status,
        appliedAt: status === 'APPLIED' && !existing.appliedAt ? new Date() : existing.appliedAt
      },
      select: applicationSelect
    });
    return res.json({ application });
  } catch (error) { return next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId: req.user!.userId }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' } });
    await prisma.jobApplication.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export default router;
