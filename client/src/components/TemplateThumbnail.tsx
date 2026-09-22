import { Box, Typography } from '@mui/material';
import type { TemplateId } from '../types';

const templateCopy: Record<TemplateId, { label: string; description: string; accent: string }> = {
  professional: { label: 'Professional', description: 'Structured and polished', accent: '#2563eb' },
  minimal: { label: 'Minimal', description: 'Quietly confident', accent: '#475569' },
  modern: { label: 'Modern', description: 'Bold with personality', accent: '#0f766e' },
  editorial: { label: 'Editorial', description: 'Refined and distinctive', accent: '#8a5a2b' },
  creative: { label: 'Creative', description: 'Expressive and warm', accent: '#7a3e52' },
  compact: { label: 'Compact', description: 'High-signal and efficient', accent: '#334155' }
};

export function TemplateThumbnail({ template, compact = false }: { template: TemplateId; compact?: boolean }) {
  const copy = templateCopy[template];
  return <Box className={`template-thumbnail template-thumbnail-${template}${compact ? ' compact' : ''}`} aria-label={`${copy.label} template`}>
    <Box className="template-thumb-top">
      <Box className="template-thumb-avatar" />
      <Box flex={1}><Box className="template-thumb-name" /><Box className="template-thumb-subtitle" /></Box>
    </Box>
    <Box className="template-thumb-contact"><i /><i /><i /></Box>
    <Box className="template-thumb-section"><Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line" /><Box className="template-thumb-line medium" /></Box>
    <Box className="template-thumb-section"><Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line medium" /><Box className="template-thumb-line" /></Box>
    {!compact && <Box className="template-thumb-label"><Typography variant="caption" fontWeight={800}>{copy.label}</Typography><Typography variant="caption" color="text.secondary">{copy.description}</Typography></Box>}
  </Box>;
}

export default TemplateThumbnail;
