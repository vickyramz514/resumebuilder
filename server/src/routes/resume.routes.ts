import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uniqueSlug, resumeSelect } from '../services/resume.service.js';

const router = Router();
router.use(requireAuth);
const dataSchema = z.record(z.string(), z.unknown());
const createSchema = z.object({ title: z.string().trim().min(1).max(120).optional(), data: dataSchema.optional(), templateId: z.string().min(1).max(40).optional() });
const updateSchema = z.object({ title: z.string().trim().min(1).max(120).optional(), data: dataSchema.optional(), templateId: z.string().min(1).max(40).optional() }).refine((value) => Object.keys(value).length > 0);
const idParam = z.object({ id: z.string().min(1) });
const defaultData = { id: '', title: 'My Resume', template: 'professional', accentColor: '#202124', updatedAt: new Date().toISOString(), personal: { name: 'Your Name', headline: 'Your Professional Headline', contact: { email: '', phone: '', location: '', website: '', linkedin: '', github: '' } }, summary: '', skills: [], experience: [], education: [], projects: [], certifications: [], sections: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'] };

router.get('/', async (req, res, next) => {
  try { return res.json({ resumes: await prisma.resume.findMany({ where: { userId: req.user!.userId }, orderBy: { updatedAt: 'desc' }, select: resumeSelect }) }); } catch (error) { return next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const values = createSchema.parse(req.body ?? {});
    const data = values.data ?? defaultData;
    const resume = await prisma.resume.create({ data: { userId: req.user!.userId, title: values.title ?? 'My Resume', templateId: values.templateId ?? String((data as any).template ?? 'professional'), data: data as Prisma.InputJsonValue } , select: resumeSelect });
    return res.status(201).json({ resume });
  } catch (error) { return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const resume = await prisma.resume.findFirst({ where: { id, userId: req.user!.userId }, select: resumeSelect });
    if (!resume) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    return res.json({ resume });
  } catch (error) { return next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params); const values = updateSchema.parse(req.body);
    const existing = await prisma.resume.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    const resume = await prisma.resume.update({ where: { id }, data: { ...values, data: values.data as any }, select: resumeSelect });
    return res.json({ resume });
  } catch (error) { return next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params); const existing = await prisma.resume.findFirst({ where: { id, userId: req.user!.userId }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    await prisma.resume.delete({ where: { id } }); return res.status(204).send();
  } catch (error) { return next(error); }
});

router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params); const original = await prisma.resume.findFirst({ where: { id, userId: req.user!.userId }, select: resumeSelect });
    if (!original) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    const data = structuredClone(original.data) as any; data.id = '';
    const resume = await prisma.resume.create({ data: { userId: req.user!.userId, title: `${original.title} Copy`, templateId: original.templateId, data }, select: resumeSelect });
    return res.status(201).json({ resume });
  } catch (error) { return next(error); }
});

router.patch('/:id/title', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params); const title = z.object({ title: z.string().trim().min(1).max(120) }).parse(req.body).title;
    const existing = await prisma.resume.findFirst({ where: { id, userId: req.user!.userId }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    return res.json({ resume: await prisma.resume.update({ where: { id }, data: { title }, select: resumeSelect }) });
  } catch (error) { return next(error); }
});

router.post('/:id/share', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params); const isPublic = z.object({ isPublic: z.boolean() }).parse(req.body).isPublic;
    const existing = await prisma.resume.findFirst({ where: { id, userId: req.user!.userId }, select: { id: true, title: true, publicSlug: true } });
    if (!existing) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    const publicSlug = isPublic ? (existing.publicSlug ?? await uniqueSlug(existing.title)) : null;
    return res.json({ resume: await prisma.resume.update({ where: { id }, data: { isPublic, publicSlug }, select: resumeSelect }) });
  } catch (error) { return next(error); }
});

export default router;
