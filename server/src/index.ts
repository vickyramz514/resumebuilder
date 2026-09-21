import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT ?? 3001);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'ResumeForge API' }));
app.post('/api/pdf', async (req, res) => {
  const { html, resume } = req.body as { html?: string; resume?: { personal?: { name?: string } } };
  if (!html || typeof html !== 'string') return res.status(400).json({ error: 'html is required' });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
    const safeName = (resume?.personal?.name || 'ResumeForge Resume').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${safeName || 'ResumeForge_Resume'}.pdf"` }).send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'PDF export failed' });
  } finally { await browser?.close(); }
});
app.post('/api/export/pdf', (req, res) => {
  req.url = '/api/pdf';
  return res.redirect(307, '/api/pdf');
});
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(serverDir, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
app.listen(port, () => console.log(`ResumeForge API listening on http://localhost:${port}`));
