import { Box, Typography } from '@mui/material';
import type { TemplateId } from '../types';
import { TEMPLATE_META } from '../templates/catalog';

export function TemplateThumbnail({ template, compact = false }: { template: TemplateId; compact?: boolean }) {
  const copy = TEMPLATE_META[template] ?? TEMPLATE_META.professional;
  const isSidebar = copy.layout === 'sidebar';
  const invertedAside = template === 'creative' || template === 'folio';
  return <Box className={`template-thumbnail template-thumbnail-${template}${compact ? ' compact' : ''}${copy.tier === 'paid' ? ' is-paid' : ' is-free'}`} aria-label={`${copy.label} template, ${copy.tier === 'paid' ? 'Pro' : 'Free'}`}>
    <Box className={`template-tier ${copy.tier}`}>{copy.tier === 'paid' ? 'Pro' : 'Free'}</Box>
    {(template === 'modern' || template === 'executive' || template === 'lumen' || template === 'velvet' || template === 'slate' || template === 'noir') && <Box className={`template-thumb-band${template === 'lumen' ? ' is-gradient' : ''}${template === 'velvet' || template === 'noir' ? ' is-dark' : ''}${template === 'slate' ? ' is-navy' : ''}`} sx={{ bgcolor: copy.accent }} />}
    <Box className={`template-thumb-top${template === 'classic' ? ' is-centered' : ''}`}>
      <Box className="template-thumb-avatar" sx={isSidebar ? { bgcolor: template === 'modern' ? '#fff8' : copy.accent } : undefined} />
      <Box flex={1} className="template-thumb-identity">
        <Box className="template-thumb-name" sx={template === 'modern' ? { bgcolor: '#ffffffcc' } : undefined} />
        <Box className="template-thumb-subtitle" sx={template === 'modern' ? { bgcolor: '#ffffff88' } : undefined} />
      </Box>
    </Box>
    {isSidebar ? <Box className="template-thumb-columns">
      <Box className="template-thumb-aside" sx={{ bgcolor: invertedAside ? copy.accent : '#eef1f4', borderRadius: template === 'folio' ? 0 : undefined }}>
        <Box className="template-thumb-line wide" sx={{ bgcolor: invertedAside ? '#ffffff55' : undefined }} />
        <Box className="template-thumb-line" sx={{ bgcolor: invertedAside ? '#ffffff55' : undefined }} />
        <Box className="template-thumb-line medium" sx={{ bgcolor: invertedAside ? '#ffffff55' : undefined }} />
      </Box>
      <Box className="template-thumb-main">
        <Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line" /><Box className="template-thumb-line medium" />
      </Box>
    </Box> : <>
      <Box className={`template-thumb-contact${template === 'classic' ? ' is-centered' : ''}`}><i /><i /><i /></Box>
      <Box className="template-thumb-section"><Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line" /><Box className="template-thumb-line medium" /></Box>
      <Box className="template-thumb-section"><Box className="template-thumb-heading" sx={{ bgcolor: copy.accent }} /><Box className="template-thumb-line wide" /><Box className="template-thumb-line medium" /><Box className="template-thumb-line" /></Box>
    </>}
    {!compact && <Box className="template-thumb-label"><Typography variant="caption" fontWeight={800}>{copy.label}</Typography><Typography variant="caption" color="text.secondary">{copy.description}</Typography></Box>}
  </Box>;
}

export default TemplateThumbnail;
