import { Box, Typography } from '@mui/material';
import type { TemplateId } from '../types';

const templateCopy: Record<TemplateId, { label: string; description: string; accent: string; layout: 'sidebar' | 'single' }> = {
  professional: { label: 'Professional', description: 'Boxed sidebar, ATS-friendly', accent: '#2563eb', layout: 'sidebar' },
  minimal: { label: 'Minimal', description: 'Quiet, no boxes or rules', accent: '#475569', layout: 'single' },
  modern: { label: 'Modern', description: 'Color band header + sidebar', accent: '#0f766e', layout: 'sidebar' },
  editorial: { label: 'Editorial', description: 'Serif, magazine-style', accent: '#8a5a2b', layout: 'single' },
  creative: { label: 'Creative', description: 'Bold color-filled sidebar', accent: '#7a3e52', layout: 'sidebar' },
  compact: { label: 'Compact', description: 'Dense, high-signal', accent: '#334155', layout: 'single' }
};

export function TemplateThumbnail({ template, compact = false }: { template: TemplateId; compact?: boolean }) {
  const copy = templateCopy[template];
  const isSidebar = copy.layout === 'sidebar';
  return <Box className={`template-thumbnail template-thumbnail-${template}${compact ? ' compact' : ''}`} aria-label={`${copy.label} template`}>
    {template === 'modern' && <Box className="template-thumb-band" sx={{ bgcolor: copy.accent }} />}
    <Box className="template-thumb-top">
      <Box className="template-thumb-avatar" sx={isSidebar ? { bgcolor: template === 'modern' ? '#fff8' : copy.accent } : undefined} />
      <Box flex={1}><Box className="template-thumb-name" sx={template === 'modern' ? { bgcolor: '#ffffffcc' } : undefined} /><Box className="template-thumb-subtitle" sx={template === 'modern' ? { bgcolor: '#ffffff88' } : undefined} /></Box>
    </Box>
    {isSidebar ? <Box className="template-thumb-columns">
      <Box className="template-thumb-aside" sx={{ bgcolor: template === 'creative' ? copy.accent : '#eef1f4' }}>
        <Box className="template-thumb-line wide" sx={{ bgcolor: template === 'creative' ? '#ffffff55' : undefined }} />
        <Box className="template-thumb-line" sx={{ bgcolor: template === 'creative' ? '#ffffff55' : undefined }} />
        <Box className="template-thumb-line medium" sx={{ bgcolor: template === 'creative' ? '#ffffff55' : undefined }} />
      </Box>
      <Box className="template-thumb-main">
        <Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line" /><Box className="template-thumb-line medium" />
      </Box>
    </Box> : <>
      <Box className="template-thumb-contact"><i /><i /><i /></Box>
      <Box className="template-thumb-section"><Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line" /><Box className="template-thumb-line medium" /></Box>
      <Box className="template-thumb-section"><Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line medium" /><Box className="template-thumb-line" /></Box>
    </>}
    {!compact && <Box className="template-thumb-label"><Typography variant="caption" fontWeight={800}>{copy.label}</Typography><Typography variant="caption" color="text.secondary">{copy.description}</Typography></Box>}
  </Box>;
}

export default TemplateThumbnail;
