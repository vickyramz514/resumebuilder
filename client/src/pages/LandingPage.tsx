import { useRef, useState, type ChangeEvent } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Container,
  Divider, Drawer, IconButton, Paper, Stack, Typography
} from '@mui/material';
import {
  ArrowRight, Check, ChevronDown, Download, Eye, FileText, GripVertical, Layers,
  Menu, PenLine, Share2, Sparkles, Upload, WandSparkles, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store';
import { normalizeImportedResume } from '../utils/importResume';
import { TemplateThumbnail } from '../components/TemplateThumbnail';
import type { TemplateId } from '../types';
import '../landing.css';

const templates: { id: TemplateId; name: string; description: string; bestFor: string }[] = [
  { id: 'professional', name: 'Professional', description: 'A clear sidebar and a reading order that holds up in a first skim.', bestFor: 'Client work, operations, finance' },
  { id: 'minimal', name: 'Minimal', description: 'Quiet type and open space, so the experience stays in front.', bestFor: 'When the work should speak' },
  { id: 'modern', name: 'Modern', description: 'A color band and sidebar for a sharper first glance.', bestFor: 'Product, tech, and hybrid roles' },
  { id: 'editorial', name: 'Editorial', description: 'Serif headlines and a magazine rhythm for a longer story.', bestFor: 'Research, writing, strategy' },
  { id: 'creative', name: 'Creative', description: 'A warm, color-filled sidebar for portfolios and people-first roles.', bestFor: 'Design and community work' },
  { id: 'compact', name: 'Compact', description: 'Tighter spacing when you have more than a page of proof.', bestFor: 'Senior and multi-role careers' }
];

const audiences = [
  { title: 'Engineering', copy: 'Projects, tools, and outcomes in an order a hiring manager can scan.' },
  { title: 'Design', copy: 'Layouts with a point of view, without turning the page into a poster.' },
  { title: 'Product & research', copy: 'Room for the narrative, the decisions, and the result.' },
  { title: 'Early career', copy: 'Education and projects carry as much weight as job titles.' },
  { title: 'A new field', copy: 'Lead with the through-line, then the evidence that supports it.' },
  { title: 'More than one version', copy: 'Duplicate a resume, rename it, and tailor the copy for the next role.' }
];

const features = [
  { icon: Eye, title: 'Live preview', copy: 'The page updates as you type, so length, hierarchy, and spacing stay visible while you edit.', tone: 'green' },
  { icon: WandSparkles, title: 'Writing help you approve', copy: 'Improve a summary, rewrite bullets, draft project points, or tailor the page to a job. Nothing is saved until you apply a suggestion.', tone: 'amber' },
  { icon: Layers, title: 'Six layouts, one resume', copy: 'Switch between Professional, Minimal, Modern, Editorial, Creative, and Compact without rewriting your content.', tone: 'green' },
  { icon: PenLine, title: 'Type, color, and density', copy: 'Pick a font, an accent, a type size, line height, spacing, and a comfortable, compact, or airy density.', tone: 'ink' },
  { icon: Download, title: 'A PDF that matches the page', copy: 'Export the resume you see. If you need a fallback, the editor can also print from the browser.', tone: 'green' },
  { icon: Share2, title: 'Private until you share', copy: 'Keep the file in your library, or turn on a public link you can copy, open, and switch off again.', tone: 'amber' }
];

const pageParts = [
  { title: 'Profile', copy: 'A short summary aimed at the role, not a biography.' },
  { title: 'Experience', copy: 'Role, company, dates, location, and the bullets that carry the proof.' },
  { title: 'Education', copy: 'School, degree, and the dates that belong on the page.' },
  { title: 'Skills', copy: 'A list you can shape, including suggestions matched to a job description.' },
  { title: 'Projects', copy: 'Name, link, technologies, and a description or bullet list.' },
  { title: 'Certifications', copy: 'Name, issuer, and date, kept in the order you choose.' }
];

const assistantMoves = [
  'Improve the summary for a target role',
  'Rewrite experience so the result is specific',
  'Draft project bullets from what you already wrote',
  'Suggest skills, including ones a job description asks for',
  'Tailor the page, then keep only the lines you want'
];

const steps = [
  { icon: FileText, title: 'Choose a starting point', copy: 'Open a guided blank resume, pick one of the six layouts, or import a ResumeForge JSON export you already have.' },
  { icon: GripVertical, title: 'Shape the story', copy: 'Reorder sections, adjust the design, and use the assistant when a line needs to be clearer. You apply only the suggestions you want.' },
  { icon: ArrowRight, title: 'Send the version that fits', copy: 'Export a PDF, keep extra versions in your library, and share a public link only when you are ready.' }
];

const faqs = [
  { q: 'Do I need an account?', a: 'Saving to your library, sharing a link, PDF export, and the writing assistant use an account. This page sends you to create one, or back to your dashboard if you are already signed in.' },
  { q: 'Will the assistant overwrite my resume?', a: 'No. Suggestions open in a review panel. They are written into the resume only after you apply the ones you want.' },
  { q: 'What can I import?', a: 'A ResumeForge JSON export. The importer checks that the file has resume content, then keeps it ready so you can save it to your library.' },
  { q: 'Can I change the template later?', a: 'Yes. Your content stays in place when you switch layouts. Font, accent, spacing, and density live in the editor and can change at any time.' },
  { q: 'Who can see a shared resume?', a: 'Nobody, until you turn sharing on from the dashboard. A public link shows only that resume, and you can disable it whenever you want.' },
  { q: 'Will an applicant tracking system be able to read it?', a: 'The templates use real text, clear headings, and a simple reading order so a person and a common parser can both follow the page.' }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const replaceResume = useResumeStore((state) => state.replaceResume);
  const inputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const startCreating = () => navigate(isAuthenticated ? '/dashboard' : '/register');
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const closeMenu = () => setMenuOpen(false);

  return <Box className="landing-page">
    <Box component="header" className="landing-header">
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={1.5} py={1.75}>
          <Box className="landing-brand" component="a" href="#top"><Box className="landing-brand-icon"><Sparkles size={17} fill="currentColor" /></Box><Typography fontWeight={850} letterSpacing="-0.8px">ResumeForge</Typography></Box>
          <Stack direction="row" spacing={3} sx={{ ml: 5, display: { xs: 'none', md: 'flex' } }} className="landing-nav">
            <a href="#features">Features</a>
            <a href="#templates">Templates</a>
            <a href="#editor">Editor</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </Stack>
          <Box flex={1} />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            {isAuthenticated
              ? <Button color="inherit" onClick={() => navigate('/dashboard')}>My dashboard</Button>
              : <><Button color="inherit" onClick={() => navigate('/login')}>Sign in</Button><Button variant="contained" onClick={startCreating}>Get started</Button></>}
          </Stack>
          <IconButton sx={{ display: { xs: 'flex', md: 'none' } }} onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></IconButton>
        </Stack>
      </Container>
    </Box>

    <Drawer anchor="right" open={menuOpen} onClose={closeMenu} className="landing-drawer">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography fontWeight={800}>ResumeForge</Typography>
        <IconButton onClick={closeMenu} aria-label="Close menu"><X size={18} /></IconButton>
      </Stack>
      <Stack component="nav" spacing={0.5} className="landing-drawer-nav">
        <a href="#features" onClick={closeMenu}>Features</a>
        <a href="#templates" onClick={closeMenu}>Templates</a>
        <a href="#editor" onClick={closeMenu}>Editor</a>
        <a href="#how-it-works" onClick={closeMenu}>How it works</a>
        <a href="#faq" onClick={closeMenu}>FAQ</a>
      </Stack>
      <Stack spacing={1} mt={3}>
        {isAuthenticated
          ? <Button variant="contained" onClick={() => { closeMenu(); navigate('/dashboard'); }}>My dashboard</Button>
          : <>
            <Button variant="outlined" onClick={() => { closeMenu(); navigate('/login'); }}>Sign in</Button>
            <Button variant="contained" onClick={() => { closeMenu(); startCreating(); }}>Get started</Button>
          </>}
      </Stack>
    </Drawer>

    <Box component="main" id="top">
      <Box className="landing-hero">
        <Container maxWidth="lg">
          <Box className="landing-hero-grid">
            <Box className="landing-hero-copy">
              <Chip icon={<Sparkles size={14} />} label="Editor, templates, and writing help" className="landing-kicker" />
              <Typography component="h1">Make your next move <Box component="span">look inevitable.</Box></Typography>
              <Typography className="landing-lede">Build a resume with a live preview, six layouts, and an assistant that only changes the lines you approve.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={4}>
                <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={startCreating}>Create my resume</Button>
                <Button variant="outlined" size="large" startIcon={<Upload size={17} />} onClick={() => inputRef.current?.click()} disabled={isImporting}>{isImporting ? 'Reading file…' : 'Import JSON resume'}</Button>
                <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
              </Stack>
              {importError && <Alert severity="error" onClose={() => setImportError('')} sx={{ mt: 2, maxWidth: 520 }}>{importError}</Alert>}
              <Stack direction="row" spacing={2.5} mt={3} className="landing-proof">
                <span><Check size={15} /> Free to start</span>
                <span><Check size={15} /> No design skills needed</span>
                <span><Check size={15} /> You approve every suggestion</span>
              </Stack>
            </Box>
            <Box className="landing-hero-art" aria-label="ResumeForge editor preview">
              <Box className="hero-glow" />
              <Paper className="hero-editor-window" elevation={0}>
                <Stack direction="row" spacing={.75} className="hero-window-bar"><i /><i /><i /><Typography variant="caption">ResumeForge / Editor</Typography></Stack>
                <Box className="hero-editor-body">
                  <Box className="hero-editor-sidebar"><Box className="hero-sidebar-logo"><Sparkles size={12} /></Box><i /><i /><i /><i /></Box>
                  <Box className="hero-editor-content">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box><Typography variant="caption" color="text.secondary">My resume</Typography><Typography fontWeight={800}>Product resume</Typography></Box>
                      <Chip label="Saved" size="small" color="success" variant="outlined" />
                    </Stack>
                    <Box className="hero-resume-paper">
                      <Box className="hero-resume-heading"><Box><Box className="hero-resume-name" /><Box className="hero-resume-role" /></Box><Box className="hero-resume-contact"><i /><i /><i /></Box></Box>
                      <Box className="hero-resume-rule" />
                      <Box className="hero-resume-columns">
                        <Box><Box className="hero-resume-label" /><Box className="hero-resume-line wide" /><Box className="hero-resume-line" /><Box className="hero-resume-line medium" /><Box className="hero-resume-label second" /><Box className="hero-resume-line wide" /><Box className="hero-resume-line" /></Box>
                        <Box><Box className="hero-resume-label" /><Box className="hero-resume-line" /><Box className="hero-resume-line wide" /><Box className="hero-resume-label second" /><Box className="hero-resume-line medium" /><Box className="hero-resume-line" /></Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
              <Paper className="hero-floating-card hero-floating-top" elevation={0}><WandSparkles size={18} /><Box><Typography variant="caption">Suggestion ready</Typography><Typography fontWeight={800}>Apply it, or leave it.</Typography></Box></Paper>
              <Paper className="hero-floating-card hero-floating-bottom" elevation={0}><Box className="hero-check"><Check size={14} /></Box><Box><Typography variant="caption">Clear headings</Typography><Typography variant="body2" fontWeight={750}>Easy for people to scan</Typography></Box></Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box className="landing-stats">
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Typography><strong>One library</strong> for the draft, the tailored version, and the page you send.</Typography>
            <Stack direction="row" spacing={{ xs: 2, sm: 5 }}>
              <Box><strong>6</strong><span>layouts</span></Box>
              <Box><strong>Live</strong><span>preview</span></Box>
              <Box><strong>PDF</strong><span>when you export</span></Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box component="section" className="landing-section audience-section">
        <Container maxWidth="lg">
          <Box className="section-intro">
            <Chip label="Who it is for" />
            <Typography variant="h2">The same editor, a different emphasis.</Typography>
            <Typography>Keep more than one resume when the role, the field, or the amount of proof changes.</Typography>
          </Box>
          <Box className="audience-grid">
            {audiences.map((item) => <Box key={item.title} className="audience-card">
              <Typography variant="h6">{item.title}</Typography>
              <Typography variant="body2">{item.copy}</Typography>
            </Box>)}
          </Box>
        </Container>
      </Box>

      <Box component="section" id="features" className="landing-section features-section">
        <Container maxWidth="lg">
          <Box className="section-intro">
            <Chip label="In the product" />
            <Typography variant="h2">What you can actually do here.</Typography>
            <Typography>Write, arrange, and export without handing the page to a template you cannot change.</Typography>
          </Box>
          <Box className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return <Box key={feature.title} className="feature-card">
                <Box className={`feature-icon tone-${feature.tone}`}><Icon size={18} /></Box>
                <Typography variant="h6">{feature.title}</Typography>
                <Typography variant="body2">{feature.copy}</Typography>
              </Box>;
            })}
          </Box>
        </Container>
      </Box>

      <Box component="section" id="templates" className="landing-section templates-section">
        <Container maxWidth="lg">
          <Box className="section-intro">
            <Chip label="Start with a strong foundation" />
            <Typography variant="h2">A template for the way you want to be read.</Typography>
            <Typography>Every layout is built for a skim: clear headings, real text, and a rhythm you can still edit.</Typography>
          </Box>
          <Box className="template-showcase">
            {templates.map((template) => <Box key={template.id} className="showcase-card">
              <TemplateThumbnail template={template.id} />
              <Box className="showcase-card-copy">
                <Typography variant="overline" className="showcase-best-for">{template.bestFor}</Typography>
                <Typography variant="h6">{template.name}</Typography>
                <Typography variant="body2">{template.description}</Typography>
                <Button size="small" endIcon={<ArrowRight size={15} />} onClick={startCreating}>Use this template</Button>
              </Box>
            </Box>)}
          </Box>
        </Container>
      </Box>

      <Box component="section" id="editor" className="landing-section editor-section">
        <Container maxWidth="lg">
          <Box className="section-intro">
            <Chip label="On the page" />
            <Typography variant="h2">A full resume, not three empty boxes.</Typography>
            <Typography>Drag sections into the order the role needs. The assistant stays beside the draft until you accept a change.</Typography>
          </Box>
          <Box className="inside-grid">
            <Box className="inside-panel">
              <Typography variant="overline" className="inside-kicker">Sections you can reorder</Typography>
              <Box className="page-parts">
                {pageParts.map((part, index) => <Box key={part.title} className="page-part">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Box>
                    <Typography variant="subtitle1">{part.title}</Typography>
                    <Typography variant="body2">{part.copy}</Typography>
                  </Box>
                </Box>)}
              </Box>
            </Box>
            <Box className="inside-panel inside-panel-dark">
              <Box className="inside-dark-icon"><WandSparkles size={18} /></Box>
              <Typography variant="h5">The assistant reviews. You decide.</Typography>
              <Typography className="inside-dark-lede">Open it from the editor when a line is vague. Generated text is previewed first and is never applied on its own.</Typography>
              <Box component="ul" className="assistant-list">
                {assistantMoves.map((move) => <li key={move}><Check size={15} />{move}</li>)}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="section" id="how-it-works" className="landing-section how-section">
        <Container maxWidth="lg">
          <Box className="section-intro">
            <Chip label="A better way to begin" />
            <Typography variant="h2">From blank page to ready to send.</Typography>
            <Typography>Three steps. You can leave and come back; signed-in edits save to your library.</Typography>
          </Box>
          <Box className="steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return <Box key={step.title}>
                <Box className="step-number">0{index + 1}</Box>
                <Icon size={22} />
                <Typography variant="h6">{step.title}</Typography>
                <Typography variant="body2">{step.copy}</Typography>
              </Box>;
            })}
          </Box>
        </Container>
      </Box>

      <Box component="section" id="faq" className="landing-section faq-section">
        <Container maxWidth="md">
          <Box className="section-intro">
            <Chip label="Before you start" />
            <Typography variant="h2">A few things worth knowing.</Typography>
          </Box>
          {faqs.map((item) => <Accordion key={item.q} disableGutters elevation={0} className="faq-item">
            <AccordionSummary expandIcon={<ChevronDown size={18} />}><Typography fontWeight={750}>{item.q}</Typography></AccordionSummary>
            <AccordionDetails><Typography variant="body2">{item.a}</Typography></AccordionDetails>
          </Accordion>)}
        </Container>
      </Box>

      <Box className="landing-cta">
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h2">Your next chapter deserves a better first page.</Typography>
            <Typography>Start with a layout, import a JSON export, or open the resume you already saved.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" mt={3}>
              <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={startCreating}>{isAuthenticated ? 'Go to my resumes' : 'Start building for free'}</Button>
              <Button variant="outlined" size="large" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>{isAuthenticated ? 'Open the editor' : 'I already have an account'}</Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>

    <Box component="footer" className="landing-footer">
      <Container maxWidth="lg">
        <Box className="footer-grid">
          <Box>
            <Box className="landing-brand"><Box className="landing-brand-icon"><Sparkles size={15} fill="currentColor" /></Box><Typography fontWeight={850}>ResumeForge</Typography></Box>
            <Typography variant="body2" className="footer-blurb">A calmer place to write, arrange, and export the resume you are willing to put your name on.</Typography>
          </Box>
          <Box>
            <Typography variant="overline">Product</Typography>
            <a href="#features">Features</a>
            <a href="#templates">Templates</a>
            <a href="#editor">Editor</a>
          </Box>
          <Box>
            <Typography variant="overline">Start</Typography>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
            <button type="button" onClick={startCreating}>{isAuthenticated ? 'Dashboard' : 'Create an account'}</button>
          </Box>
          <Box>
            <Typography variant="overline">Account</Typography>
            {isAuthenticated
              ? <button type="button" onClick={() => navigate('/dashboard')}>My resumes</button>
              : <button type="button" onClick={() => navigate('/login')}>Sign in</button>}
            <button type="button" onClick={() => inputRef.current?.click()}>Import JSON</button>
          </Box>
        </Box>
        <Divider sx={{ my: 2.5 }} />
        <Typography variant="caption">© {new Date().getFullYear()} ResumeForge</Typography>
      </Container>
    </Box>
  </Box>;
}
