import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { renderPdf } from '../services/pdf.service.js';

const router = Router();
router.post('/:id/pdf', requireAuth, async (req, res, next) => {
  try {
    const resume = await prisma.resume.findFirst({ where: { id: String(req.params.id), userId: req.user!.userId }, select: { data: true } });
    if (!resume) return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume not found' } });
    const html = z.string().min(1).optional().parse(req.body?.html) ?? `<html><body><h1>${(resume.data as any).personal?.name ?? 'Resume'}</h1></body></html>`;
    const pdf = await renderPdf(html);
    return res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="ResumeForge_Resume.pdf"' }).send(pdf);
  } catch (error) { return next(error); }
});
export default router;
