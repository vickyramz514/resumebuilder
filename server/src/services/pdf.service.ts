import { chromium } from 'playwright';

export async function renderPdf(html: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
  } finally {
    await browser.close();
  }
}

export function publicResumeHtml(data: any) {
  const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] as string);
  const sections = (data.sections ?? []) as string[];
  const section = (name: string, content: string) => content ? `<section><h2>${name}</h2>${content}</section>` : '';
  const experience = (data.experience ?? []).map((item: any) => `<article><strong>${escape(item.role)}</strong> — ${escape(item.company)}<p>${(item.bullets ?? []).map((bullet: string) => `<li>${escape(bullet)}</li>`).join('')}</p></article>`).join('');
  const projects = (data.projects ?? []).map((item: any) => `<article><strong>${escape(item.name)}</strong><p>${escape(item.description)}</p></article>`).join('');
  const body = sections.map((name) => name === 'summary' ? section('Profile', `<p>${escape(data.summary)}</p>`) : name === 'experience' ? section('Experience', experience) : name === 'projects' ? section('Projects', projects) : name === 'skills' ? section('Skills', `<p>${(data.skills ?? []).map(escape).join(' · ')}</p>`) : '').join('');
  return `<html><head><style>body{font-family:Arial,sans-serif;padding:28px;color:#202124}h1{margin-bottom:4px}h2{border-bottom:1px solid #ccc;padding-bottom:4px;font-size:16px}section{margin-top:18px}article{margin:10px 0}li{margin:3px 0}</style></head><body><h1>${escape(data.personal?.name || 'Resume')}</h1><p>${escape(data.personal?.headline)}</p><p>${escape(data.personal?.contact?.email)} ${escape(data.personal?.contact?.phone)} ${escape(data.personal?.contact?.location)}</p>${body}</body></html>`;
}
