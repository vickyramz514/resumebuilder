import { Router } from 'express';
import { prisma } from '../db.js';
import { resumeSelect } from '../services/resume.service.js';
import { userHasPaidEntitlement } from '../middleware/paid.middleware.js';
import { publicResumeHtml, renderPdf } from '../services/pdf.service.js';

const router = Router();
router.get('/resumes/:slug', async (req, res, next) => {
  try {
    const row = await prisma.resume.findFirst({ where: { publicSlug: req.params.slug, isPublic: true }, select: resumeSelect });
    if (!row) return res.status(404).json({ error: { code: 'PUBLIC_RESUME_NOT_FOUND', message: 'Resume not found' } });
    const pdfExport = await userHasPaidEntitlement(row.userId);
    return res.json({
      resume: {
        id: row.id,
        title: row.title,
        data: row.data,
        templateId: row.templateId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      },
      pdfExport
    });
  } catch (error) { return next(error); }
});
router.get('/resumes/:slug/pdf', async (req, res, next) => {
  try {
    const resume = await prisma.resume.findFirst({ where: { publicSlug: req.params.slug, isPublic: true }, select: { data: true, userId: true } });
    if (!resume) return res.status(404).json({ error: { code: 'PUBLIC_RESUME_NOT_FOUND', message: 'Resume not found' } });
    if (!await userHasPaidEntitlement(resume.userId)) {
      return res.status(402).json({ error: { code: 'PAYWALL', message: 'PDF export is included on Starter and Pro.' } });
    }
    const pdf = await renderPdf(publicResumeHtml(resume.data));
    return res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="ResumeForge_Resume.pdf"' }).send(pdf);
  } catch (error) { return next(error); }
});
export default router;
