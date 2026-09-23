import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Alert, AppBar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer,
  FormControl, IconButton, InputLabel, Menu, MenuItem, Select, Slider, Snackbar, Stack, Tab, Tabs,
  TextField, Toolbar, Tooltip, Typography, useMediaQuery
} from '@mui/material';
import {
  Copy, Download, ExternalLink, Eye, EyeOff, FileJson, FilePlus2, FileText, Menu as MenuIcon, MoreVertical,
  Palette, PanelLeftClose, PanelLeftOpen, Plus, Share2, Sparkles, Undo2, ZoomIn, ZoomOut
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ResumePreview } from '../templates/ResumePreview';
import { useActiveResume, useResumeStore } from '../store';
import { TEMPLATE_CATALOG } from '../templates/catalog';
import type { FontFamily, ResumeDesign, ResumeDensity, SectionType, TemplateId } from '../types';
import { PersonalForm } from '../components/PersonalForm';
import { CertificationsForm, EducationForm, ExperienceForm, ProjectsForm, SkillsForm, SummaryForm } from '../components/SectionForms';
import { TemplateThumbnail } from '../components/TemplateThumbnail';
import { AIAssistant, type AssistantResult } from '../components/AIAssistant';
import { CompletenessCard } from '../components/CompletenessCard';
import { getResumeCompleteness } from '../utils/completeness';
import { applyAiSuggestion } from '../utils/applyAiSuggestion';
import { useAuthStore } from '../store/authStore';
import {
  createResume, deleteResume as deleteCloudResume, duplicateResume as duplicateCloudResume, getResume,
  listResumes, shareResume, updateResume as saveCloudResume
} from '../services/resumeApi';
import '../app.css';

const sectionLabels: Record<SectionType, string> = { summary: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications' };
const sectionIcons: Record<SectionType, string> = { summary: '01', experience: '02', education: '03', skills: '04', projects: '05', certifications: '06' };
const colors = ['#202124', '#626871', '#0f766e', '#8a5a2b', '#7a3e52', '#1e3a5f', '#4338ca', '#15232c', '#7c2d12', '#111827'];
const fonts: { id: FontFamily; label: string }[] = [
  { id: 'inter', label: 'Inter · modern' },
  { id: 'source-sans', label: 'Source Sans · friendly' },
  { id: 'georgia', label: 'Georgia · classic' },
  { id: 'ibm-plex', label: 'IBM Plex · technical' },
  { id: 'space-grotesk', label: 'Space Grotesk · expressive' }
];
const defaultDesign: ResumeDesign = { fontFamily: 'inter', fontSize: 11, lineHeight: 1.45, spacing: 18, density: 'comfortable' };

function SortableSection({ section, hidden, onSelect, onToggleHidden }: { section: SectionType; hidden: boolean; onSelect: () => void; onToggleHidden: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section });
  return (
    <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`section-row ${hidden ? 'hidden' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners}>⋮⋮</span>
      <span className="section-number">{sectionIcons[section]}</span>
      <span className="section-row-label" onClick={onSelect}>{sectionLabels[section]}</span>
      <Tooltip title={hidden ? 'Show on resume' : 'Hide from resume'}>
        <IconButton size="small" aria-label={hidden ? `Show ${sectionLabels[section]}` : `Hide ${sectionLabels[section]}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onToggleHidden(); }}>
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function ResumeBuilder() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const resume = useActiveResume();
  const {
    selectedSection, setSelectedSection, reorderSections, setTemplate, updateResume, activeId,
    duplicateResume, deleteResume, replaceResume, resumes, setActive, addResume, toggleSectionHidden, undo, canUndo
  } = useResumeStore();
  const [cloudLoading, setCloudLoading] = useState(Boolean(routeId));
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'offline'>('saved');
  const skipSave = useRef(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');
  const [tab, setTab] = useState<'editor' | 'design'>('editor');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [toast, setToast] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ isPublic: boolean; publicSlug?: string | null }>({ isPublic: false });
  const [library, setLibrary] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const isMobile = useMediaQuery('(max-width:900px)');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeTitle = useMemo(() => resume?.title ?? 'Untitled Resume', [resume]);
  const completeness = useMemo(() => resume ? getResumeCompleteness(resume) : { items: [], done: 0, total: 1, score: 0 }, [resume]);
  const hiddenSections = resume?.hiddenSections ?? [];
  const navSections = useMemo<Array<SectionType | 'personal'>>(() => resume ? ['personal', ...resume.sections] : ['personal'], [resume]);
  const navIndex = navSections.indexOf(selectedSection);

  const refreshLibrary = useCallback(async () => {
    if (!authenticated) return;
    try {
      const result = await listResumes();
      setLibrary(result.resumes.map((item) => ({ id: item.id, title: item.title, updatedAt: item.updatedAt })));
    } catch {
      /* keep the last known library */
    }
  }, [authenticated]);

  useEffect(() => { refreshLibrary(); }, [refreshLibrary]);

  useEffect(() => {
    if (!authenticated || !routeId) return;
    let cancelled = false;
    setCloudLoading(true);
    getResume(routeId).then(({ resume: cloud }) => {
      if (cancelled) return;
      skipSave.current = true;
      replaceResume({ ...cloud.data, id: cloud.id, title: cloud.title, template: cloud.templateId as TemplateId, updatedAt: cloud.updatedAt });
      setShareInfo({ isPublic: cloud.isPublic, publicSlug: cloud.publicSlug });
      setSaveState('saved');
    }).catch(() => {
      if (cancelled) return;
      const local = useResumeStore.getState().resumes.find((item) => item.id === routeId);
      if (local) setSaveState('offline');
      else navigate('/dashboard', { replace: true });
    }).finally(() => { if (!cancelled) setCloudLoading(false); });
    return () => { cancelled = true; };
  }, [authenticated, routeId, replaceResume, navigate]);

  useEffect(() => {
    if (!authenticated || routeId) return;
    createResume().then(({ resume: cloud }) => navigate(`/resume/${cloud.id}/edit`, { replace: true })).catch(() => navigate('/dashboard', { replace: true }));
  }, [authenticated, routeId, navigate]);

  const saveNow = useCallback(async () => {
    const current = useResumeStore.getState().resumes.find((item) => item.id === (routeId ?? activeId));
    if (!authenticated || !routeId || !current || current.id !== routeId) return;
    setSaveState('saving');
    try {
      await saveCloudResume(routeId, { title: current.title, data: current, templateId: current.template });
      setSaveState('saved');
      refreshLibrary();
    } catch {
      setSaveState('offline');
    }
  }, [authenticated, routeId, activeId, refreshLibrary]);

  useEffect(() => {
    if (!authenticated || !routeId || cloudLoading || !resume || resume.id !== routeId) return;
    if (skipSave.current) { skipSave.current = false; return; }
    setSaveState('saving');
    const timer = window.setTimeout(() => { void saveNow(); }, 1000);
    return () => window.clearTimeout(timer);
  }, [authenticated, routeId, cloudLoading, resume, saveNow]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveNow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveNow]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (saveState === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [saveState]);

  const selectSection = (section: SectionType | 'personal') => {
    setSelectedSection(section);
    setTab('editor');
    if (isMobile) setMobilePane('editor');
  };

  const handleNew = async () => {
    setMobileMenu(false);
    if (!authenticated) { addResume(); return; }
    try {
      const result = await createResume();
      navigate(`/resume/${result.resume.id}/edit`);
      refreshLibrary();
    } catch {
      addResume();
    }
  };

  const openResume = (id: string) => {
    setMobileMenu(false);
    if (authenticated) navigate(`/resume/${id}/edit`);
    else setActive(id);
  };

  const applySuggestion = (result: AssistantResult) => {
    if (!resume) return;
    const patch = applyAiSuggestion(resume, result);
    if (Object.keys(patch).length) {
      updateResume(patch);
      if (result.kind === 'summary' || result.kind === 'tailor') selectSection('summary');
      else if (result.kind === 'experience') selectSection('experience');
      else if (result.kind === 'project') selectSection('projects');
      else if (result.kind === 'skills') selectSection('skills');
      setToast('Suggestion applied — review it in the editor');
    }
  };

  const exportPdf = async () => {
    if (!resume) return;
    const node = document.querySelector('.resume-sheet');
    if (!node) return;
    const css = [...document.styleSheets].flatMap((sheet) => { try { return [...sheet.cssRules].map((rule) => rule.cssText); } catch { return []; } }).join('\n');
    const response = await fetch(routeId ? `/api/resumes/${routeId}/pdf` : '/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume, html: `<html><head><style>${css}</style></head><body>${node.outerHTML}</body></html>` }) });
    if (!response.ok) { window.print(); return; }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${resume.personal.name || 'resume'}.pdf`; link.click(); URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!resume) return;
    const blob = new Blob([JSON.stringify({ resume }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resume.personal.name || resume.title || 'resume'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('JSON file downloaded');
  };

  const toggleShare = async () => {
    if (!routeId) return;
    try {
      const result = await shareResume(routeId, !shareInfo.isPublic);
      setShareInfo({ isPublic: result.resume.isPublic, publicSlug: result.resume.publicSlug });
      setToast(result.resume.isPublic ? 'Public link enabled' : 'Resume is private again');
    } catch {
      setToast('Unable to update sharing');
    }
  };

  const shareUrl = shareInfo.publicSlug ? `${window.location.origin}/r/${shareInfo.publicSlug}` : '';
  const libraryItems = authenticated ? library : resumes.map((item) => ({ id: item.id, title: item.title, updatedAt: item.updatedAt }));
  const showEditor = !isMobile || mobilePane === 'editor';
  const showPreview = !isMobile || mobilePane === 'preview';

  if (!resume || cloudLoading) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading resume…</Box>;

  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = resume.sections.indexOf(active.id as SectionType);
    const newIndex = resume.sections.indexOf(over.id as SectionType);
    if (oldIndex >= 0 && newIndex >= 0) reorderSections(oldIndex, newIndex);
  };

  const sectionForm = selectedSection === 'personal' ? <PersonalForm /> : selectedSection === 'summary' ? <SummaryForm /> : selectedSection === 'experience' ? <ExperienceForm /> : selectedSection === 'education' ? <EducationForm /> : selectedSection === 'skills' ? <SkillsForm /> : selectedSection === 'projects' ? <ProjectsForm /> : <CertificationsForm />;
  const editorPanel = (
    <Box className="editor-panel">
      <Box className="editor-heading">
        <Typography variant="h6">{selectedSection === 'personal' ? 'Personal details' : sectionLabels[selectedSection as SectionType]}</Typography>
        <Typography variant="body2" color="text.secondary">Start here, then work through each step. Changes save automatically.</Typography>
        <Stack direction="row" spacing={1} mt={1.25}>
          <Button size="small" disabled={navIndex <= 0} onClick={() => selectSection(navSections[navIndex - 1])}>Back</Button>
          <Button size="small" variant="outlined" disabled={navIndex >= navSections.length - 1} onClick={() => selectSection(navSections[navIndex + 1])}>Next section</Button>
        </Stack>
      </Box>
      <Box className="form-scroll">
        {selectedSection === 'personal' && <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>Begin with your name and contact details. Then use the steps above to add the story behind your work.</Alert>}
        {sectionForm}
      </Box>
    </Box>
  );

  const design = { ...defaultDesign, ...(resume.design ?? {}) };
  const updateDesign = (patch: Partial<ResumeDesign>) => updateResume({ design: { ...design, ...patch } });
  const designPanel = (
    <Box className="editor-panel">
      <Box className="editor-heading">
        <Typography variant="h6">Design & layout</Typography>
        <Typography variant="body2" color="text.secondary">Make it yours</Typography>
      </Box>
      <Box className="form-scroll">
        <Typography variant="overline" color="text.secondary">Template gallery</Typography>
        <Box className="template-picker">{TEMPLATE_CATALOG.map((item) => (
          <Box key={item.id} className={`template-picker-option ${resume.template === item.id ? 'selected' : ''}`} onClick={() => setTemplate(item.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setTemplate(item.id); }}>
            <TemplateThumbnail template={item.id} compact />
            <Box className="template-picker-copy">
              <Typography variant="body2" fontWeight={750}>{item.label}</Typography>
              <Typography variant="caption" color="text.secondary">{item.description}</Typography>
            </Box>
            {resume.template === item.id && <Chip label="Selected" size="small" color="primary" />}
          </Box>
        ))}</Box>
        <Typography variant="overline" color="text.secondary" display="block" mt={3}>Accent color</Typography>
        <Stack direction="row" spacing={1.2} mt={1} useFlexGap flexWrap="wrap">{colors.map((color) => <IconButton aria-label={`Use ${color} accent`} key={color} onClick={() => updateResume({ accentColor: color })} sx={{ bgcolor: color, width: 28, height: 28, border: resume.accentColor === color ? '3px solid #dbeafe' : 'none', '&:hover': { bgcolor: color } }} />)}</Stack>
        <Typography variant="overline" color="text.secondary" display="block" mt={3}>Typography</Typography>
        <Stack spacing={2} mt={1}>
          <FormControl size="small" fullWidth>
            <InputLabel id="font-family-label">Font family</InputLabel>
            <Select labelId="font-family-label" label="Font family" value={design.fontFamily} onChange={(event) => updateDesign({ fontFamily: event.target.value as FontFamily })}>
              {fonts.map((font) => <MenuItem value={font.id} key={font.id}>{font.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Box><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Font size</Typography><Typography variant="caption" fontWeight={700}>{design.fontSize}px</Typography></Stack><Slider size="small" min={9} max={14} step={0.5} value={design.fontSize} onChange={(_, value) => updateDesign({ fontSize: value as number })} /></Box>
          <Box><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Line height</Typography><Typography variant="caption" fontWeight={700}>{design.lineHeight.toFixed(2)}</Typography></Stack><Slider size="small" min={1.2} max={1.8} step={0.05} value={design.lineHeight} onChange={(_, value) => updateDesign({ lineHeight: value as number })} /></Box>
          <Box><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Section spacing</Typography><Typography variant="caption" fontWeight={700}>{design.spacing}px</Typography></Stack><Slider size="small" min={8} max={30} step={1} value={design.spacing} onChange={(_, value) => updateDesign({ spacing: value as number })} /></Box>
          <FormControl size="small" fullWidth>
            <InputLabel id="density-label">Content density</InputLabel>
            <Select labelId="density-label" label="Content density" value={design.density} onChange={(event) => updateDesign({ density: event.target.value as ResumeDensity })}>
              <MenuItem value="comfortable">Comfortable</MenuItem>
              <MenuItem value="compact">Compact</MenuItem>
              <MenuItem value="airy">Airy</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Typography variant="overline" color="text.secondary" display="block" mt={3}>Sections</Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>Drag to reorder. Hide a section without deleting its content.</Typography>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
          <SortableContext items={resume.sections} strategy={verticalListSortingStrategy}>
            {resume.sections.map((section) => (
              <SortableSection
                key={section}
                section={section}
                hidden={hiddenSections.includes(section)}
                onSelect={() => selectSection(section)}
                onToggleHidden={() => toggleSectionHidden(section)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Box>
    </Box>
  );

  return (
    <Box className="app-shell">
      <AppBar position="static" color="inherit" elevation={0} className="topbar">
        <Toolbar>
          <IconButton edge="start" aria-label="Open resume navigation" onClick={() => setMobileMenu(!mobileMenu)} sx={{ display: { md: 'none' }, mr: 1 }}><MenuIcon size={20} /></IconButton>
          <Box className="brand-mark"><Sparkles size={18} fill="currentColor" /><Typography fontWeight={800} letterSpacing="-0.5px">ResumeForge</Typography></Box>
          <Button size="small" color="inherit" onClick={() => navigate('/dashboard')} sx={{ textTransform: 'none', ml: 1 }}>My Resumes</Button>
          <Box className="topbar-title">
            <FileText size={16} color="#64748b" />
            <Typography variant="body2" noWrap>{activeTitle}</Typography>
            <Chip label={saveState === 'saving' ? 'Saving…' : saveState === 'offline' ? 'Offline — saved locally' : 'Saved ✓'} size="small" color={saveState === 'offline' ? 'warning' : 'success'} variant="outlined" />
            <Chip label={`${completeness.score}%`} size="small" variant="outlined" color={completeness.score === 100 ? 'success' : 'default'} />
          </Box>
          <Box flex={1} />
          {isMobile && (
            <Tabs value={mobilePane} onChange={(_, value) => setMobilePane(value)} sx={{ minHeight: 36, mr: 1, '& .MuiTab-root': { minHeight: 36, minWidth: 64, fontSize: 12 } }}>
              <Tab value="editor" label="Edit" />
              <Tab value="preview" label="Preview" />
            </Tabs>
          )}
          <Tooltip title="Undo last change">
            <span><IconButton aria-label="Undo last change" disabled={!canUndo} onClick={() => undo()}><Undo2 size={18} /></IconButton></span>
          </Tooltip>
          <Tooltip title="Improve with AI">
            <Button onClick={() => setAiOpen(true)} startIcon={<Sparkles size={16} />} color="inherit" size="small" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>AI Assistant</Button>
          </Tooltip>
          <Tooltip title="Improve with AI">
            <IconButton aria-label="Open AI assistant" onClick={() => setAiOpen(true)} sx={{ display: { xs: 'inline-flex', md: 'none' } }}><Sparkles size={18} /></IconButton>
          </Tooltip>
          <Tooltip title="Download a PDF copy">
            <Button onClick={exportPdf} startIcon={<Download size={17} />} variant="contained" size="small">
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Export PDF</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Export</Box>
            </Button>
          </Tooltip>
          <Tooltip title="More resume actions">
            <IconButton aria-label="More resume actions" onClick={(e) => setMenuAnchor(e.currentTarget)}><MoreVertical size={19} /></IconButton>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => { setShareOpen(true); setMenuAnchor(null); }}><Share2 size={15} />&nbsp; Share link</MenuItem>
            <MenuItem onClick={() => { exportJson(); setMenuAnchor(null); }}><FileJson size={15} />&nbsp; Export JSON</MenuItem>
            <MenuItem onClick={async () => { try { const result = await duplicateCloudResume(activeId); navigate(`/resume/${result.resume.id}/edit`); } catch { duplicateResume(activeId); } setMenuAnchor(null); }}>Duplicate resume</MenuItem>
            <MenuItem onClick={() => { if (window.confirm('Delete this resume?')) { deleteCloudResume(activeId).catch(() => undefined); deleteResume(activeId); navigate('/dashboard'); } setMenuAnchor(null); }}>Delete resume</MenuItem>
            <MenuItem onClick={() => { logout(); navigate('/login'); setMenuAnchor(null); }}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box className="workspace">
        <Drawer variant={isMobile ? 'temporary' : 'persistent'} open={isMobile ? mobileMenu : leftOpen} onClose={() => setMobileMenu(false)} className="left-drawer" ModalProps={{ keepMounted: true }}>
          <Box className="drawer-inner">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="overline" color="text.secondary">My resumes</Typography>
              <Tooltip title="New resume"><IconButton size="small" onClick={handleNew}><Plus size={17} /></IconButton></Tooltip>
            </Stack>
            <Stack spacing={0.75}>
              {libraryItems.map((item) => (
                <Box key={item.id} onClick={() => openResume(item.id)} className={`resume-list-item ${item.id === (routeId ?? activeId) ? 'active' : ''}`}>
                  <FileText size={16} />
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight={item.id === (routeId ?? activeId) ? 700 : 500} noWrap>{item.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(item.updatedAt).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
            <Button startIcon={<FilePlus2 size={16} />} fullWidth variant="outlined" sx={{ mt: 2 }} onClick={handleNew}>New resume</Button>
          </Box>
        </Drawer>
        {!isMobile && <Tooltip title={leftOpen ? 'Hide resume list' : 'Show resume list'}><IconButton aria-label={leftOpen ? 'Hide resume list' : 'Show resume list'} className="collapse-left" onClick={() => setLeftOpen(!leftOpen)}>{leftOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</IconButton></Tooltip>}
        {showEditor && (
          <Box className={`editor-side ${leftOpen && !isMobile ? 'with-library' : ''}`}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
              <Tab icon={<FileText size={16} />} iconPosition="start" label="Edit content" value="editor" />
              <Tab icon={<Palette size={16} />} iconPosition="start" label="Design" value="design" />
            </Tabs>
            {tab === 'editor' ? (
              <>
                <Box className="section-nav">
                  <CompletenessCard score={completeness.score} items={completeness.items} onSelect={selectSection} />
                  <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block', mb: 0.75, mt: 1.5 }}>Build your resume step by step</Typography>
                  <Box className={`section-nav-item ${selectedSection === 'personal' ? 'active' : ''}`} onClick={() => selectSection('personal')}><span className="section-number">00</span>Personal details</Box>
                  <Divider />
                  {resume.sections.map((section) => (
                    <Box key={section} className={`section-nav-item ${selectedSection === section ? 'active' : ''} ${hiddenSections.includes(section) ? 'is-hidden' : ''}`} onClick={() => selectSection(section)}>
                      <span className="section-number">{sectionIcons[section]}</span>
                      {sectionLabels[section]}
                      {hiddenSections.includes(section) && <Chip label="Hidden" size="small" sx={{ ml: 'auto', height: 18, fontSize: 10 }} />}
                    </Box>
                  ))}
                </Box>
                {editorPanel}
              </>
            ) : designPanel}
          </Box>
        )}
        {showPreview && (
          <Box className="preview-area">
            <Box className="preview-toolbar">
              <Typography variant="caption" color="text.secondary">Preview — click a section to edit it</Typography>
              <Box flex={1} />
              <Tooltip title="Zoom out"><span><IconButton size="small" aria-label="Zoom out" disabled={zoom <= 70} onClick={() => setZoom((value) => Math.max(70, value - 10))}><ZoomOut size={16} /></IconButton></span></Tooltip>
              <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'center' }}>{zoom}%</Typography>
              <Tooltip title="Zoom in"><span><IconButton size="small" aria-label="Zoom in" disabled={zoom >= 130} onClick={() => setZoom((value) => Math.min(130, value + 10))}><ZoomIn size={16} /></IconButton></span></Tooltip>
              {!isMobile && <Tooltip title={rightOpen ? 'Hide preview' : 'Show preview'}><IconButton size="small" onClick={() => setRightOpen(!rightOpen)}>{rightOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</IconButton></Tooltip>}
            </Box>
            {rightOpen && (
              <Box className="preview-scroll">
                <Box className="preview-zoom" style={{ ['--preview-zoom' as string]: String(zoom / 100) }}>
                  <ResumePreview resume={resume} onSelectSection={selectSection} />
                </Box>
              </Box>
            )}
            {!rightOpen && !isMobile && <Alert severity="info" sx={{ m: 3 }}>Preview is hidden. Click the panel icon to show it.</Alert>}
          </Box>
        )}
      </Box>
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} resume={resume} onApply={applySuggestion} />
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
        <DialogTitle>Share resume</DialogTitle>
        <DialogContent>
          {shareInfo.isPublic ? (
            <Stack spacing={2} pt={1}>
              <Typography variant="body2">Anyone with this link can view your resume.</Typography>
              <TextField fullWidth value={shareUrl} InputProps={{ readOnly: true }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button startIcon={<Copy size={15} />} onClick={() => { void navigator.clipboard.writeText(shareUrl); setToast('Link copied'); }}>Copy link</Button>
                <Button startIcon={<ExternalLink size={15} />} onClick={() => window.open(shareUrl, '_blank')}>Open resume</Button>
              </Stack>
            </Stack>
          ) : <Typography py={1}>Your resume is private. Enable sharing to create a public link.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Close</Button>
          <Button variant="contained" onClick={toggleShare}>{shareInfo.isPublic ? 'Disable sharing' : 'Enable sharing'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={2800} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

export default ResumeBuilder;
