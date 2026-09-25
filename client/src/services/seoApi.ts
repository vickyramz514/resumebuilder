import { apiRequest } from './api';

export type SeoSection = { heading: string; paragraphs: string[]; bullets?: string[] };
export type SeoBody = { intro: string; sections: SeoSection[]; related: string[] };

export type SeoPageRecord = {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  content: string;
  keywords: string[];
  canonicalUrl: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export function parseSeoBody(content: string): SeoBody {
  try {
    const parsed = JSON.parse(content) as SeoBody;
    if (parsed && typeof parsed.intro === 'string' && Array.isArray(parsed.sections)) {
      return { intro: parsed.intro, sections: parsed.sections, related: Array.isArray(parsed.related) ? parsed.related : [] };
    }
  } catch {
    /* plain text stored by an editor */
  }
  return { intro: content, sections: [], related: [] };
}

export function getPublishedSeoPages() {
  return apiRequest<{ pages: SeoPageRecord[] }>('/api/seo/pages');
}

export function getSeoPage(slug: string) {
  return apiRequest<{ page: SeoPageRecord }>(`/api/seo/pages/${encodeURIComponent(slug)}`);
}
