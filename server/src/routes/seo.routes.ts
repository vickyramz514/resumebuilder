import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { canonicalForSlug } from '../services/seoPages.js';

const router = Router();
const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase slug');
const writeSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().trim().min(8).max(160),
  metaDescription: z.string().trim().min(40).max(320),
  h1: z.string().trim().min(8).max(180),
  content: z.string().trim().min(40),
  keywords: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  canonicalUrl: z.string().trim().url().optional(),
  published: z.boolean().optional()
});

const publicSelect = {
  id: true,
  slug: true,
  title: true,
  metaDescription: true,
  h1: true,
  content: true,
  keywords: true,
  canonicalUrl: true,
  published: true,
  createdAt: true,
  updatedAt: true
} as const;

function requireSeoWriter(req: Request, res: Response, next: NextFunction) {
  const configured = env.seoWriteToken;
  const header = req.headers.authorization;
  if (configured && header === `Bearer ${configured}`) return next();
  if (!configured && process.env.NODE_ENV !== 'production') return requireAuth(req, res, next);
  return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A SEO write token is required' } });
}

function notFound(res: Response) {
  return res.status(404).json({ error: { code: 'SEO_PAGE_NOT_FOUND', message: 'SEO page not found' } });
}

function isUniqueConflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

router.get('/pages', async (_req, res, next) => {
  try {
    const pages = await prisma.seoPage.findMany({ where: { published: true }, orderBy: { slug: 'asc' }, select: publicSelect });
    return res.json({ pages });
  } catch (error) { return next(error); }
});

router.get('/pages/:slug', async (req, res, next) => {
  try {
    const parsed = slugSchema.safeParse(req.params.slug);
    if (!parsed.success) return notFound(res);
    const page = await prisma.seoPage.findFirst({ where: { slug: parsed.data, published: true }, select: publicSelect });
    if (!page) return notFound(res);
    return res.json({ page });
  } catch (error) { return next(error); }
});

router.post('/pages', requireSeoWriter, async (req, res, next) => {
  try {
    const values = writeSchema.parse(req.body ?? {});
    const slug = values.slug ?? slugSchema.parse(values.h1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    const page = await prisma.seoPage.create({
      data: {
        slug,
        title: values.title,
        metaDescription: values.metaDescription,
        h1: values.h1,
        content: values.content,
        keywords: values.keywords ?? [],
        canonicalUrl: values.canonicalUrl ?? canonicalForSlug(slug),
        published: values.published ?? false
      },
      select: publicSelect
    });
    return res.status(201).json({ page });
  } catch (error) {
    if (isUniqueConflict(error)) return res.status(409).json({ error: { code: 'SEO_SLUG_EXISTS', message: 'A page with this slug already exists' } });
    return next(error);
  }
});

router.put('/pages/:slug', requireSeoWriter, async (req, res, next) => {
  try {
    const parsed = slugSchema.safeParse(req.params.slug);
    if (!parsed.success) return notFound(res);
    const values = writeSchema.partial().parse(req.body ?? {});
    const existing = await prisma.seoPage.findUnique({ where: { slug: parsed.data }, select: { id: true } });
    if (!existing) return notFound(res);
    const nextSlug = values.slug ?? parsed.data;
    const page = await prisma.seoPage.update({
      where: { slug: parsed.data },
      data: {
        slug: values.slug,
        title: values.title,
        metaDescription: values.metaDescription,
        h1: values.h1,
        content: values.content,
        keywords: values.keywords,
        published: values.published,
        canonicalUrl: values.canonicalUrl ?? (values.slug ? canonicalForSlug(nextSlug) : undefined)
      },
      select: publicSelect
    });
    return res.json({ page });
  } catch (error) {
    if (isUniqueConflict(error)) return res.status(409).json({ error: { code: 'SEO_SLUG_EXISTS', message: 'A page with this slug already exists' } });
    return next(error);
  }
});

router.delete('/pages/:slug', requireSeoWriter, async (req, res, next) => {
  try {
    const parsed = slugSchema.safeParse(req.params.slug);
    if (!parsed.success) return notFound(res);
    const existing = await prisma.seoPage.findUnique({ where: { slug: parsed.data }, select: { id: true } });
    if (!existing) return notFound(res);
    await prisma.seoPage.delete({ where: { slug: parsed.data } });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export default router;
