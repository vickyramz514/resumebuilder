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
import aiRoutes from './routes/ai.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import { handleRazorpayCallback, handleRazorpayWebhook } from './routes/payment.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { renderPdf } from './services/pdf.service.js';
import { ensureBillingPlans } from './services/billingPlans.js';

const app = express();
const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (env.allowedOrigins.includes(origin.replace(/\/$/, ''))) return true;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin) ? origin ?? true : false),
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin) ? origin ?? true : false),
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
app.post('/v1/payment/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
app.post('/api/payment/razorpay-callback', express.urlencoded({ extended: true }), handleRazorpayCallback);
app.get('/api/payment/razorpay-callback', handleRazorpayCallback);
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'ResumeForge API' }));
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/resumes', pdfRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
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
void ensureBillingPlans().catch((error) => console.error('Unable to seed billing plans', error));
const shutdown = async () => { server.close(); await prisma.$disconnect(); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
