import { Router } from 'express';
import { prisma } from '../db.js';
import { resumeSelect } from '../services/resume.service.js';
import { publicResumeHtml, renderPdf } from '../services/pdf.service.js';

const router = Router();
router.get('/resumes/:slug', async (req, res, next) => {
  try {
    const resume = await prisma.resume.findFirst({ where: { publicSlug: req.params.slug, isPublic: true }, select: { ...resumeSelect, userId: false, isPublic: false, publicSlug: false } });
    if (!resume) return res.status(404).json({ error: { code: 'PUBLIC_RESUME_NOT_FOUND', message: 'Resume not found' } });
    return res.json({ resume });
  } catch (error) { return next(error); }
});
router.get('/resumes/:slug/pdf', async (req, res, next) => {
  try {
    const resume = await prisma.resume.findFirst({ where: { publicSlug: req.params.slug, isPublic: true }, select: { data: true } });
    if (!resume) return res.status(404).json({ error: { code: 'PUBLIC_RESUME_NOT_FOUND', message: 'Resume not found' } });
    const pdf = await renderPdf(publicResumeHtml(resume.data));
    return res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="ResumeForge_Resume.pdf"' }).send(pdf);
  } catch (error) { return next(error); }
});
export default router;
