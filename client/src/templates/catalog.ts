import type { TemplateId } from '../types';

export type TemplateLayout = 'sidebar' | 'single';
export type TemplateTier = 'free' | 'paid';

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  description: string;
  pitch: string;
  accent: string;
  layout: TemplateLayout;
  tier: TemplateTier;
}

export const TEMPLATE_CATALOG: TemplateMeta[] = [
  { id: 'professional', label: 'Professional', description: 'Clean and structured', pitch: 'A timeless layout for making a clear, confident first impression.', accent: '#2563eb', layout: 'sidebar', tier: 'free' },
  { id: 'minimal', label: 'Minimal', description: 'Simple and elegant', pitch: 'Beautiful restraint that keeps your experience in focus.', accent: '#475569', layout: 'single', tier: 'free' },
  { id: 'modern', label: 'Modern', description: 'Bold and expressive', pitch: 'A little more personality, without sacrificing readability.', accent: '#0f766e', layout: 'sidebar', tier: 'free' },
  { id: 'compact', label: 'Compact', description: 'High-signal and efficient', pitch: 'High-signal spacing for experienced candidates with more to say.', accent: '#334155', layout: 'single', tier: 'free' },
  { id: 'classic', label: 'Classic', description: 'Centered and traditional', pitch: 'A centered, ATS-safe layout hiring managers already know how to read.', accent: '#1f2937', layout: 'single', tier: 'free' },
  { id: 'technical', label: 'Technical', description: 'Left rail, sharp type', pitch: 'A precise engineer-friendly layout with a left accent rail and crisp chips.', accent: '#4338ca', layout: 'single', tier: 'free' },
  { id: 'harbor', label: 'Harbor', description: 'Soft rules, open type', pitch: 'A calm free layout with tinted section labels and a quiet left edge.', accent: '#255c4b', layout: 'single', tier: 'free' },
  { id: 'atlas', label: 'Atlas', description: 'Plain text, one column', pitch: 'A plain single column with black rules, for forms that scan the file.', accent: '#111827', layout: 'single', tier: 'free' },
  { id: 'slate', label: 'Slate', description: 'Navy name block', pitch: 'A dark name block and a quiet page, still one reading order.', accent: '#1e293b', layout: 'single', tier: 'free' },
  { id: 'linen', label: 'Linen', description: 'Warm paper, serif name', pitch: 'Cream paper and a dotted rule, for a page that should feel written by hand.', accent: '#8a5a2b', layout: 'single', tier: 'free' },
  { id: 'grove', label: 'Grove', description: 'Forest rail, small caps', pitch: 'A green edge and small-cap headings, still one column a parser can follow.', accent: '#1f6b45', layout: 'single', tier: 'free' },
  { id: 'editorial', label: 'Editorial', description: 'Refined and distinctive', pitch: 'A refined, story-forward layout with a considered rhythm.', accent: '#8a5a2b', layout: 'single', tier: 'paid' },
  { id: 'creative', label: 'Creative', description: 'Expressive and warm', pitch: 'Warm visual accents for portfolios and people-first roles.', accent: '#7a3e52', layout: 'sidebar', tier: 'paid' },
  { id: 'executive', label: 'Executive', description: 'Serif with a strong rule', pitch: 'Quiet authority for senior roles, board CVs, and leadership searches.', accent: '#1e3a5f', layout: 'single', tier: 'paid' },
  { id: 'academic', label: 'Academic', description: 'CV hierarchy', pitch: 'A curriculum-vitae rhythm for research, teaching, and long-form careers.', accent: '#7c2d12', layout: 'single', tier: 'paid' },
  { id: 'swiss', label: 'Swiss', description: 'Oversized and geometric', pitch: 'Bold type and generous space for design, product, and brand-led roles.', accent: '#111827', layout: 'single', tier: 'paid' },
  { id: 'folio', label: 'Folio', description: 'Full-bleed dark sidebar', pitch: 'A gallery-like panel layout with a dark left column for contact and skills.', accent: '#15232c', layout: 'sidebar', tier: 'paid' },
  { id: 'lumen', label: 'Lumen', description: 'Gradient header', pitch: 'A luminous header and rounded sidebar for roles that should feel designed.', accent: '#0f766e', layout: 'sidebar', tier: 'paid' },
  { id: 'chronicle', label: 'Chronicle', description: 'Timeline', pitch: 'Experience runs down a gold timeline, so a long career reads as a story.', accent: '#8a5a2b', layout: 'single', tier: 'paid' },
  { id: 'velvet', label: 'Velvet', description: 'Dark masthead', pitch: 'A charcoal masthead and warm paper for creative and leadership pages.', accent: '#1c1714', layout: 'sidebar', tier: 'paid' },
  { id: 'meridian', label: 'Meridian', description: 'Labels in the margin', pitch: 'Section names sit in the left margin, so a long page stays easy to scan.', accent: '#1e3a5f', layout: 'single', tier: 'paid' },
  { id: 'noir', label: 'Noir', description: 'Full dark page', pitch: 'A black page with warm type and a gold rule, for roles that should feel designed.', accent: '#e4c98a', layout: 'sidebar', tier: 'paid' },
  { id: 'aurora', label: 'Aurora', description: 'Soft wash, rounded side', pitch: 'A pale color wash and a rounded sidebar, lighter than the dark Pro layouts.', accent: '#0f766e', layout: 'sidebar', tier: 'paid' },
  { id: 'ledger', label: 'Ledger', description: 'Ruled rows', pitch: 'Each role sits on a hairline row, with the date kept to the right.', accent: '#1e3a5f', layout: 'single', tier: 'paid' },
  { id: 'pebble', label: 'Pebble', description: 'Rounded cards', pitch: 'Soft cards and a quiet sidebar, for a page that should feel approachable.', accent: '#64748b', layout: 'sidebar', tier: 'free' },
  { id: 'cobalt', label: 'Cobalt', description: 'Blue name rule', pitch: 'A strong blue rule under the name, then a plain column a parser can follow.', accent: '#1d4ed8', layout: 'single', tier: 'free' },
  { id: 'signal', label: 'Signal', description: 'Marked headings', pitch: 'Each heading carries a short color bar, so a long page stays easy to scan.', accent: '#0e7490', layout: 'single', tier: 'free' },
  { id: 'quartz', label: 'Quartz', description: 'Boxed sections', pitch: 'Each section sits in its own box, for a page that should feel organized.', accent: '#475569', layout: 'single', tier: 'free' },
  { id: 'cedar', label: 'Cedar', description: 'Warm left rail', pitch: 'A rust edge and small headings, still one column from top to bottom.', accent: '#9a3412', layout: 'single', tier: 'free' },
  { id: 'kite', label: 'Kite', description: 'Mint sidebar', pitch: 'A light sidebar for skills and a clean main column for the story.', accent: '#059669', layout: 'sidebar', tier: 'free' },
  { id: 'index', label: 'Index', description: 'Plain and strict', pitch: 'Black type and thin rules, the safest page to send to a form that scans the file.', accent: '#111827', layout: 'single', tier: 'free' },
  { id: 'summit', label: 'Summit', description: 'Stripe and center', pitch: 'A color stripe and a centered name, then a single reading order.', accent: '#1e3a5f', layout: 'single', tier: 'free' },
  { id: 'iris', label: 'Iris', description: 'Violet masthead', pitch: 'A violet header and a pale sidebar, for a page that should feel current.', accent: '#6d28d9', layout: 'sidebar', tier: 'paid' },
  { id: 'coral', label: 'Coral', description: 'Color side panel', pitch: 'Contact and skills sit on a coral panel, with the story kept in the open column.', accent: '#e11d48', layout: 'sidebar', tier: 'paid' },
  { id: 'ink', label: 'Ink', description: 'Oversized name', pitch: 'A huge name and a thin gold line, for a page that leads with the person.', accent: '#111827', layout: 'single', tier: 'paid' },
  { id: 'mosaic', label: 'Mosaic', description: 'Skill tiles', pitch: 'Skills read as tiles, and the rest of the page stays in a clear column.', accent: '#0d9488', layout: 'sidebar', tier: 'paid' },
  { id: 'horizon', label: 'Horizon', description: 'Full color band', pitch: 'The name sits on a full-width band, then the page returns to one column.', accent: '#0369a1', layout: 'single', tier: 'paid' },
  { id: 'orchid', label: 'Orchid', description: 'Blush paper', pitch: 'Warm paper and a serif name, for creative and people-first roles.', accent: '#9d174d', layout: 'single', tier: 'paid' },
  { id: 'prism', label: 'Prism', description: 'Corner accent', pitch: 'A sharp corner of color and a rounded sidebar, without crowding the type.', accent: '#4f46e5', layout: 'sidebar', tier: 'paid' },
  { id: 'canyon', label: 'Canyon', description: 'Rust timeline', pitch: 'Experience runs down a rust line, so a long career reads in order.', accent: '#c2410c', layout: 'single', tier: 'paid' },
  { id: 'frost', label: 'Frost', description: 'Icy side card', pitch: 'A cool header and a white side card, lighter than the dark Pro layouts.', accent: '#0284c7', layout: 'sidebar', tier: 'paid' },
  { id: 'monarch', label: 'Monarch', description: 'Double rule', pitch: 'Two rules under the name, for senior roles that should feel formal.', accent: '#1e3a5f', layout: 'single', tier: 'paid' },
  { id: 'ember', label: 'Ember', description: 'Dark side, warm page', pitch: 'A dark skills column and warm paper for the work itself.', accent: '#7c2d12', layout: 'sidebar', tier: 'paid' },
  { id: 'solstice', label: 'Solstice', description: 'Split color wash', pitch: 'A soft wash behind the name, then a single column with clear headings.', accent: '#0f766e', layout: 'single', tier: 'paid' }
];

export const TEMPLATE_IDS: TemplateId[] = TEMPLATE_CATALOG.map((item) => item.id);

export const TEMPLATE_META = Object.fromEntries(TEMPLATE_CATALOG.map((item) => [item.id, item])) as Record<TemplateId, TemplateMeta>;

export const SIDEBAR_TEMPLATES = new Set<TemplateId>(TEMPLATE_CATALOG.filter((item) => item.layout === 'sidebar').map((item) => item.id));

export const isTemplateId = (value: string): value is TemplateId => TEMPLATE_IDS.includes(value as TemplateId);

export const isPaidTemplate = (id: TemplateId) => TEMPLATE_META[id]?.tier === 'paid';
