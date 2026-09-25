import { prisma } from '../db.js';
import { relatedLabel, SEO_SEEDS, SITE_ORIGIN, type SeoBody } from './seoContent.js';

const PRIVATE_PATH_PREFIXES = ['/dashboard', '/billing', '/account', '/login', '/register', '/signup', '/resume/', '/r/', '/api'];

export function canonicalForSlug(slug: string) {
  return `${SITE_ORIGIN}/resume-builder/${slug}`;
}

export function parseSeoBody(content: string): SeoBody {
  try {
    const parsed = JSON.parse(content) as SeoBody;
    if (parsed && typeof parsed.intro === 'string' && Array.isArray(parsed.sections)) {
      return { intro: parsed.intro, sections: parsed.sections, related: Array.isArray(parsed.related) ? parsed.related : [] };
    }
  } catch {
    /* stored as plain text */
  }
  return { intro: content, sections: [], related: [] };
}

export async function ensureSeoPages() {
  for (const seed of SEO_SEEDS) {
    const existing = await prisma.seoPage.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    if (existing) continue;
    await prisma.seoPage.create({
      data: {
        slug: seed.slug,
        title: seed.title,
        metaDescription: seed.metaDescription,
        h1: seed.h1,
        content: JSON.stringify(seed.body),
        keywords: seed.keywords,
        canonicalUrl: canonicalForSlug(seed.slug),
        published: true
      }
    });
  }
}

export function xmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isPublicCanonical(url: string) {
  try {
    const path = new URL(url).pathname;
    return !PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
  } catch {
    return false;
  }
}

export async function sitemapXml() {
  const pages = await prisma.seoPage.findMany({
    where: { published: true },
    orderBy: { slug: 'asc' },
    select: { slug: true, updatedAt: true, canonicalUrl: true }
  });
  const urls = [
    `  <url><loc>${xmlEscape(`${SITE_ORIGIN}/`)}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...pages
      .map((page) => ({ loc: page.canonicalUrl || canonicalForSlug(page.slug), updatedAt: page.updatedAt }))
      .filter((page) => isPublicCanonical(page.loc))
      .map((page) => `  <url><loc>${xmlEscape(page.loc)}</loc><lastmod>${page.updatedAt.toISOString().slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function robotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /resume-builder/',
    'Disallow: /dashboard',
    'Disallow: /billing',
    'Disallow: /account',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /signup',
    'Disallow: /resume/',
    'Disallow: /r/',
    'Disallow: /api',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    ''
  ].join('\n');
}

function htmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const PAGE_STYLE = `body{margin:0;background:#f4f7f5;color:#1c2824;font:18px/1.6 Inter,ui-sans-serif,system-ui,sans-serif}
a{color:#255c4b}header,main{max-width:760px;margin:0 auto;padding:28px 20px}
header a{font-weight:700;text-decoration:none}h1{font-size:2rem;line-height:1.2;letter-spacing:-.03em}
h2{font-size:1.25rem;margin:2rem 0 .4rem}ul{padding-left:1.2rem}li{margin:.35rem 0}
nav a{display:inline-block;margin:0 14px 8px 0}.cta{display:inline-block;margin-top:12px;background:#255c4b;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px}`;

export function seoHtml(page: { title: string; metaDescription: string; h1: string; content: string; canonicalUrl: string; keywords: string[] }) {
  const body = parseSeoBody(page.content);
  const sections = body.sections.map((section) => {
    const paragraphs = section.paragraphs.map((paragraph) => `<p>${htmlEscape(paragraph)}</p>`).join('');
    const bullets = section.bullets?.length ? `<ul>${section.bullets.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>` : '';
    return `<section><h2>${htmlEscape(section.heading)}</h2>${paragraphs}${bullets}</section>`;
  }).join('');
  const related = body.related
    .map((slug) => `<a href="${htmlEscape(canonicalForSlug(slug))}">${htmlEscape(relatedLabel(slug))}</a>`)
    .join('');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.metaDescription,
    keywords: page.keywords.join(', '),
    mainEntityOfPage: page.canonicalUrl,
    author: { '@type': 'Organization', name: 'ResumeForge', url: SITE_ORIGIN }
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${htmlEscape(page.title)}</title>
<meta name="description" content="${htmlEscape(page.metaDescription)}"/>
<meta name="keywords" content="${htmlEscape(page.keywords.join(', '))}"/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="${htmlEscape(page.canonicalUrl)}"/>
<meta property="og:site_name" content="ResumeForge"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${htmlEscape(page.title)}"/>
<meta property="og:description" content="${htmlEscape(page.metaDescription)}"/>
<meta property="og:url" content="${htmlEscape(page.canonicalUrl)}"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${htmlEscape(page.title)}"/>
<meta name="twitter:description" content="${htmlEscape(page.metaDescription)}"/>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
<style>${PAGE_STYLE}</style>
</head><body>
<header><a href="${SITE_ORIGIN}/">ResumeForge</a></header>
<main>
<h1>${htmlEscape(page.h1)}</h1>
<p>${htmlEscape(body.intro)}</p>
${sections}
${related ? `<nav><h2>Related guides</h2>${related}</nav>` : ''}
<p><a class="cta" href="${SITE_ORIGIN}/register">Start a resume</a></p>
</main>
</body></html>`;
}

export function seoNotFoundHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Guide not found — ResumeForge</title>
<meta name="robots" content="noindex"/>
<style>${PAGE_STYLE}</style>
</head><body>
<header><a href="${SITE_ORIGIN}/">ResumeForge</a></header>
<main>
<h1>This guide does not exist</h1>
<p>The page you requested is not published. You can go back to ResumeForge or open another guide from the homepage.</p>
<p><a class="cta" href="${SITE_ORIGIN}/">Back to ResumeForge</a></p>
</main>
</body></html>`;
}
