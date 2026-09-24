import type { TemplateId } from '../types';

export type TemplateLayout = 'sidebar' | 'single';

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  description: string;
  pitch: string;
  accent: string;
  layout: TemplateLayout;
}

export const TEMPLATE_CATALOG: TemplateMeta[] = [
  { id: 'professional', label: 'Professional', description: 'Clean and structured', pitch: 'A timeless layout for making a clear, confident first impression.', accent: '#2563eb', layout: 'sidebar' },
  { id: 'minimal', label: 'Minimal', description: 'Simple and elegant', pitch: 'Beautiful restraint that keeps your experience in focus.', accent: '#475569', layout: 'single' },
  { id: 'modern', label: 'Modern', description: 'Bold and expressive', pitch: 'A little more personality, without sacrificing readability.', accent: '#0f766e', layout: 'sidebar' },
  { id: 'editorial', label: 'Editorial', description: 'Refined and distinctive', pitch: 'A refined, story-forward layout with a considered rhythm.', accent: '#8a5a2b', layout: 'single' },
  { id: 'creative', label: 'Creative', description: 'Expressive and warm', pitch: 'Warm visual accents for portfolios and people-first roles.', accent: '#7a3e52', layout: 'sidebar' },
  { id: 'compact', label: 'Compact', description: 'High-signal and efficient', pitch: 'High-signal spacing for experienced candidates with more to say.', accent: '#334155', layout: 'single' },
  { id: 'classic', label: 'Classic', description: 'Centered and traditional', pitch: 'A centered, ATS-safe layout hiring managers already know how to read.', accent: '#1f2937', layout: 'single' },
  { id: 'executive', label: 'Executive', description: 'Serif with a strong rule', pitch: 'Quiet authority for senior roles, board CVs, and leadership searches.', accent: '#1e3a5f', layout: 'single' },
  { id: 'technical', label: 'Technical', description: 'Left rail, sharp type', pitch: 'A precise engineer-friendly layout with a left accent rail and crisp chips.', accent: '#4338ca', layout: 'single' },
  { id: 'academic', label: 'Academic', description: 'CV hierarchy', pitch: 'A curriculum-vitae rhythm for research, teaching, and long-form careers.', accent: '#7c2d12', layout: 'single' },
  { id: 'swiss', label: 'Swiss', description: 'Oversized and geometric', pitch: 'Bold type and generous space for design, product, and brand-led roles.', accent: '#111827', layout: 'single' },
  { id: 'folio', label: 'Folio', description: 'Full-bleed dark sidebar', pitch: 'A gallery-like panel layout with a dark left column for contact and skills.', accent: '#15232c', layout: 'sidebar' }
];

export const TEMPLATE_IDS: TemplateId[] = TEMPLATE_CATALOG.map((item) => item.id);

export const TEMPLATE_META = Object.fromEntries(TEMPLATE_CATALOG.map((item) => [item.id, item])) as Record<TemplateId, TemplateMeta>;

export const SIDEBAR_TEMPLATES = new Set<TemplateId>(TEMPLATE_CATALOG.filter((item) => item.layout === 'sidebar').map((item) => item.id));

export const isTemplateId = (value: string): value is TemplateId => TEMPLATE_IDS.includes(value as TemplateId);
