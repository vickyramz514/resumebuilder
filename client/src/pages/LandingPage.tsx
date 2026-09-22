import { useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Container, Divider, IconButton, Paper, Stack, Typography } from '@mui/material';
import { ArrowRight, Check, FileText, Github, Linkedin, Menu, Sparkles, Upload, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store';
import { normalizeImportedResume } from '../utils/importResume';
import { TemplateThumbnail } from '../components/TemplateThumbnail';
import type { TemplateId } from '../types';
import '../landing.css';

const templates: { id: TemplateId; name: string; description: string }[] = [
  { id: 'professional', name: 'Professional', description: 'A timeless layout for making a clear, confident first impression.' },
  { id: 'minimal', name: 'Minimal', description: 'Beautiful restraint that keeps your experience in focus.' },
  { id: 'modern', name: 'Modern', description: 'A little more personality, without sacrificing readability.' },
  { id: 'editorial', name: 'Editorial', description: 'A refined, story-forward layout with a considered rhythm.' },
  { id: 'creative', name: 'Creative', description: 'Warm visual accents for portfolios and people-first roles.' },
  { id: 'compact', name: 'Compact', description: 'High-signal spacing for experienced candidates with more to say.' }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const replaceResume = useResumeStore((state) => state.replaceResume);
  const inputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const startCreating = () => navigate(isAuthenticated ? '/dashboard' : '/register');
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportError('');
    setIsImporting(true);
    try {
      const resume = normalizeImportedResume(JSON.parse(await file.text()));
      replaceResume(resume);
      sessionStorage.setItem('resumeforge_pending_import', resume.id);
      navigate(isAuthenticated ? '/dashboard' : '/register', { state: { from: '/dashboard' } });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'We could not read that JSON file.');
    } finally {
      setIsImporting(false);
    }
  };

  return <Box className="landing-page">
    <Box component="header" className="landing-header">
      <Container maxWidth="lg"><Stack direction="row" alignItems="center" spacing={1.5} py={2}>
        <Box className="landing-brand"><Box className="landing-brand-icon"><Sparkles size={17} fill="currentColor" /></Box><Typography fontWeight={850} letterSpacing="-0.8px">ResumeForge</Typography></Box>
        <Stack direction="row" spacing={3} sx={{ ml: 5, display: { xs: 'none', md: 'flex' } }}><a href="#templates">Templates</a><a href="#how-it-works">How it works</a></Stack>
        <Box flex={1} />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
          {isAuthenticated ? <Button color="inherit" onClick={() => navigate('/dashboard')}>My dashboard</Button> : <><Button color="inherit" onClick={() => navigate('/login')}>Sign in</Button><Button variant="contained" onClick={startCreating}>Get started</Button></>}
        </Stack>
        <IconButton sx={{ display: { xs: 'flex', sm: 'none' } }} onClick={startCreating} aria-label="Get started"><Menu size={20} /></IconButton>
      </Stack></Container>
    </Box>

    <Box component="main">
      <Box className="landing-hero"><Container maxWidth="lg"><Box className="landing-hero-grid">
        <Box className="landing-hero-copy">
          <Chip icon={<Sparkles size={14} />} label="The thoughtful resume builder" className="landing-kicker" />
          <Typography component="h1">Make your next move <Box component="span">look inevitable.</Box></Typography>
          <Typography className="landing-lede">Create a resume that feels like you—clear, compelling, and ready for the opportunity you want next.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={4}>
            <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={startCreating}>Create my resume</Button>
            <Button variant="outlined" size="large" startIcon={<Upload size={17} />} onClick={() => inputRef.current?.click()} disabled={isImporting}>{isImporting ? 'Reading file…' : 'Upload existing resume'}</Button>
            <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
          </Stack>
          {importError && <Alert severity="error" onClose={() => setImportError('')} sx={{ mt: 2, maxWidth: 500 }}>{importError}</Alert>}
          <Stack direction="row" spacing={2.5} mt={3} className="landing-proof"><span><Check size={15} /> Free to start</span><span><Check size={15} /> No design skills needed</span></Stack>
        </Box>
        <Box className="landing-hero-art" aria-label="ResumeForge editor preview">
          <Box className="hero-glow" />
          <Paper className="hero-editor-window" elevation={0}>
            <Stack direction="row" spacing={.75} className="hero-window-bar"><i /><i /><i /><Typography variant="caption">ResumeForge / Editor</Typography></Stack>
            <Box className="hero-editor-body"><Box className="hero-editor-sidebar"><Box className="hero-sidebar-logo"><Sparkles size={12} /></Box><i /><i /><i /><i /></Box><Box className="hero-editor-content"><Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}><Box><Typography variant="caption" color="text.secondary">My resume</Typography><Typography fontWeight={800}>Vigneshwar R</Typography></Box><Chip label="Saved ✓" size="small" color="success" variant="outlined" /></Stack><Box className="hero-resume-paper"><Box className="hero-resume-heading"><Box><Box className="hero-resume-name" /><Box className="hero-resume-role" /></Box><Box className="hero-resume-contact"><i /><i /><i /></Box></Box><Box className="hero-resume-rule" /><Box className="hero-resume-columns"><Box><Box className="hero-resume-label" /><Box className="hero-resume-line wide" /><Box className="hero-resume-line" /><Box className="hero-resume-line medium" /><Box className="hero-resume-label second" /><Box className="hero-resume-line wide" /><Box className="hero-resume-line" /></Box><Box><Box className="hero-resume-label" /><Box className="hero-resume-line" /><Box className="hero-resume-line wide" /><Box className="hero-resume-label second" /><Box className="hero-resume-line medium" /><Box className="hero-resume-line" /></Box></Box></Box></Box></Box>
          </Paper>
          <Paper className="hero-floating-card hero-floating-top" elevation={0}><WandSparkles size={18} /><Box><Typography variant="caption">Designed to stand out</Typography><Typography fontWeight={800}>Without trying too hard.</Typography></Box></Paper>
          <Paper className="hero-floating-card hero-floating-bottom" elevation={0}><Box className="hero-check"><Check size={14} /></Box><Box><Typography variant="caption">ATS-friendly</Typography><Typography variant="body2" fontWeight={750}>Looks great everywhere</Typography></Box></Paper>
        </Box>
      </Box></Container></Box>

      <Box className="landing-stats"><Container maxWidth="lg"><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Typography><strong>One calm place</strong> to build your best work story.</Typography><Stack direction="row" spacing={{ xs: 2, sm: 5 }}><Box><strong>6</strong><span>polished templates</span></Box><Box><strong>100%</strong><span>yours to edit</span></Box><Box><strong>1 click</strong><span>to export</span></Box></Stack></Stack></Container></Box>

      <Box component="section" id="templates" className="landing-section templates-section"><Container maxWidth="lg"><Box className="section-intro"><Chip label="Start with a strong foundation" /><Typography variant="h2">A template for your kind of brilliant.</Typography><Typography>Every layout is designed for clarity, personality, and the skim test.</Typography></Box><Box className="template-showcase">{templates.map((template) => <Box key={template.id} className="showcase-card"><TemplateThumbnail template={template.id} /><Box className="showcase-card-copy"><Typography variant="h6">{template.name}</Typography><Typography variant="body2">{template.description}</Typography><Button size="small" endIcon={<ArrowRight size={15} />} onClick={startCreating}>Use this template</Button></Box></Box>)}</Box></Container></Box>

      <Box component="section" id="how-it-works" className="landing-section how-section"><Container maxWidth="lg"><Box className="section-intro"><Chip label="A better way to begin" /><Typography variant="h2">From blank page to ready to send.</Typography></Box><Box className="steps-grid"><Box><Box className="step-number">01</Box><FileText size={22} /><Typography variant="h6">Choose your starting point</Typography><Typography variant="body2">Start fresh with a guided canvas or upload a ResumeForge JSON export you already have.</Typography></Box><Box><Box className="step-number">02</Box><WandSparkles size={22} /><Typography variant="h6">Make it unmistakably yours</Typography><Typography variant="body2">Shape your story with flexible sections, thoughtful templates, and easy visual polish.</Typography></Box><Box><Box className="step-number">03</Box><ArrowRight size={22} /><Typography variant="h6">Share with confidence</Typography><Typography variant="body2">Export a crisp PDF, keep versions organized, and share a public link when you’re ready.</Typography></Box></Box></Container></Box>

      <Box className="landing-cta"><Container maxWidth="md"><Box textAlign="center"><Typography variant="h2">Your next chapter deserves a better first page.</Typography><Typography>Build something you’re proud to put your name on.</Typography><Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={startCreating} sx={{ mt: 3 }}>Start building for free</Button></Box></Container></Box>
    </Box>
    <Box component="footer" className="landing-footer"><Container maxWidth="lg"><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}><Box className="landing-brand"><Box className="landing-brand-icon"><Sparkles size={15} fill="currentColor" /></Box><Typography fontWeight={850}>ResumeForge</Typography></Box><Typography variant="caption">A calmer way to make a great impression.</Typography><Stack direction="row" spacing={1}><IconButton size="small" aria-label="GitHub"><Github size={17} /></IconButton><IconButton size="small" aria-label="LinkedIn"><Linkedin size={17} /></IconButton></Stack></Stack><Divider sx={{ my: 2 }} /><Typography variant="caption">© {new Date().getFullYear()} ResumeForge</Typography></Container></Box>
  </Box>;
}
