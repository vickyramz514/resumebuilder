/** Designed layouts included on the ₹100 Basic plan. Keep in sync with tier: 'plus' in client/src/templates/catalog.ts. */
export const PLUS_TEMPLATES = new Set([
  'editorial',
  'executive',
  'lumen',
  'aurora',
  'ledger',
  'iris',
  'horizon',
  'frost',
  'vellum',
  'ribbon'
]);

/** Layouts that stay on Starter and Pro. */
const FULL_TEMPLATES = new Set([
  'creative',
  'academic',
  'swiss',
  'folio',
  'chronicle',
  'velvet',
  'meridian',
  'noir',
  'coral',
  'ink',
  'mosaic',
  'orchid',
  'prism',
  'canyon',
  'monarch',
  'ember',
  'solstice',
  'atelier',
  'nocturne'
]);

export function templateNeedsFullPlan(templateId: string | null | undefined) {
  return FULL_TEMPLATES.has(String(templateId || ''));
}
