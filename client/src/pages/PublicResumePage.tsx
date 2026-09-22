import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Download, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ResumePreview } from '../templates/ResumePreview';
import type { Resume, TemplateId } from '../types';

export default function PublicResumePage() {
  const { slug } = useParams();
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/public/resumes/${slug}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((body) => setResume({
        ...body.resume.data,
        id: body.resume.id,
        title: body.resume.title,
        template: body.resume.templateId as TemplateId
      }))
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Alert severity="error">This resume is unavailable or no longer shared.</Alert>
      </Box>
    );
  }
  if (!resume) return <Box textAlign="center" py={10}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eef2f7' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 1.5, bgcolor: '#fff', borderBottom: '1px solid #D0D3D6' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Stack direction="row" alignItems="center" spacing={1}><Sparkles size={16} /><Typography fontWeight={800}>ResumeForge</Typography></Stack>
        </Link>
        <Button startIcon={<Download size={16} />} onClick={() => window.open(`/api/public/resumes/${slug}/pdf`, '_blank')}>Download PDF</Button>
      </Stack>
      <Box sx={{ p: { xs: 1, sm: 5 }, display: 'flex', justifyContent: 'center' }}>
        <ResumePreview resume={resume} />
      </Box>
    </Box>
  );
}
