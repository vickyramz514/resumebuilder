import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { prisma } from './db.js';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import publicRoutes from './routes/public.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { renderPdf } from './services/pdf.service.js';

const app = express();
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'ResumeForge API' }));
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/resumes', pdfRoutes);
// Phase 1's local export endpoint remains available as a graceful fallback.
app.post('/api/pdf', async (req, res, next) => {
  try {
    if (typeof req.body?.html !== 'string') return res.status(400).json({ error: { code: 'HTML_REQUIRED', message: 'html is required' } });
    const pdf = await renderPdf(req.body.html);
    const safeName = String(req.body.resume?.personal?.name || 'ResumeForge Resume').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    return res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${safeName || 'ResumeForge_Resume'}.pdf"` }).send(pdf);
  } catch (error) { return next(error); }
});
app.post('/api/export/pdf', (req, res) => { req.url = '/api/pdf'; return res.redirect(307, '/api/pdf'); });
app.use(errorMiddleware);

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(serverDir, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

const server = app.listen(env.port, () => console.log(`ResumeForge API listening on http://localhost:${env.port}`));
const shutdown = async () => { server.close(); await prisma.$disconnect(); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
