import { useEffect, useMemo, useRef, useState } from 'react';
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Alert, AppBar, Box, Button, Chip, Divider, Drawer, IconButton, Menu, MenuItem, Paper, Stack, Tab, Tabs, Toolbar, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { Download, FilePlus2, FileText, LayoutTemplate, Menu as MenuIcon, MoreVertical, Palette, PanelLeftClose, PanelLeftOpen, Plus, Sparkles, Trash2 } from 'lucide-react';
import { ResumePreview } from '../templates/ResumePreview';
import { useActiveResume, useResumeStore } from '../store';
import type { SectionType, TemplateId } from '../types';
import { PersonalForm } from '../components/PersonalForm';
import { CertificationsForm, EducationForm, ExperienceForm, ProjectsForm, SkillsForm, SummaryForm } from '../components/SectionForms';
import { TemplateThumbnail } from '../components/TemplateThumbnail';
import '../app.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createResume, getResume, updateResume as saveCloudResume, deleteResume as deleteCloudResume, duplicateResume as duplicateCloudResume } from '../services/resumeApi';
import { AIAssistant, type AssistantResult } from '../components/AIAssistant';

const sectionLabels: Record<SectionType, string> = { summary: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications' };
const sectionIcons: Record<SectionType, string> = { summary: '01', experience: '02', education: '03', skills: '04', projects: '05', certifications: '06' };
const templates: { id: TemplateId; label: string; description: string }[] = [{ id: 'professional', label: 'Professional', description: 'Clean and structured' }, { id: 'minimal', label: 'Minimal', description: 'Simple and elegant' }, { id: 'modern', label: 'Modern', description: 'Bold and expressive' }];
const colors = ['#202124', '#626871', '#0f766e', '#8a5a2b', '#7a3e52', '#111827'];

function SortableSection({ section, selected, onSelect }: { section: SectionType; selected: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section });
  return <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} onClick={onSelect} className={`section-row ${selected ? 'selected' : ''}`}><span className="drag-handle">⋮⋮</span><span className="section-number">{sectionIcons[section]}</span><span>{sectionLabels[section]}</span></Box>;
}

function ResumeBuilder() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const resume = useActiveResume();
  const { selectedSection, setSelectedSection, reorderSections, setTemplate, updateResume, activeId, duplicateResume, deleteResume, replaceResume, resumes, setActive, addResume } = useResumeStore();
  const [cloudLoading, setCloudLoading] = useState(Boolean(routeId));
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'offline'>('saved');
  const skipSave = useRef(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [tab, setTab] = useState<'editor' | 'design'>('editor');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeTitle = useMemo(() => resume?.title ?? 'Untitled Resume', [resume]);

  useEffect(() => {
    if (!authenticated || !routeId) return;
    let cancelled = false;
    setCloudLoading(true);
    getResume(routeId).then(({ resume: cloud }) => {
      if (cancelled) return;
      skipSave.current = true;
      replaceResume({ ...cloud.data, id: cloud.id, title: cloud.title, template: cloud.templateId as TemplateId, updatedAt: cloud.updatedAt });
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

  useEffect(() => {
    if (!authenticated || !routeId || cloudLoading || !resume || resume.id !== routeId) return;
    if (skipSave.current) { skipSave.current = false; return; }
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      saveCloudResume(routeId, { title: resume.title, data: resume, templateId: resume.template }).then(() => setSaveState('saved')).catch(() => setSaveState('offline'));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [authenticated, routeId, cloudLoading, resume]);

  if (!resume || cloudLoading) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading resume…</Box>;
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = resume.sections.indexOf(active.id as SectionType); const newIndex = resume.sections.indexOf(over.id as SectionType);
    if (oldIndex >= 0 && newIndex >= 0) reorderSections(oldIndex, newIndex);
  };
  const exportPdf = async () => {
    const node = document.querySelector('.resume-sheet');
    if (!node) return;
    const css = [...document.styleSheets].flatMap((sheet) => { try { return [...sheet.cssRules].map((rule) => rule.cssText); } catch { return []; } }).join('\n');
    const response = await fetch(routeId ? `/api/resumes/${routeId}/pdf` : '/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume, html: `<html><head><style>${css}</style></head><body>${node.outerHTML}</body></html>` }) });
    if (!response.ok) { window.print(); return; }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${resume.personal.name || 'resume'}.pdf`; link.click(); URL.revokeObjectURL(url);
  };
  const applyAiResult = (result: AssistantResult) => {
    if (result.kind === 'summary' && result.text) {
      updateResume({ summary: result.text });
    } else if (result.kind === 'experience' && result.bullets) {
      const target = resume.experience.find((item) => item.id === result.targetId);
      if (target) updateResume({ experience: resume.experience.map((item) => item.id === target.id ? { ...item, bullets: result.bullets ?? item.bullets } : item) });
    } else if (result.kind === 'project' && result.bullets) {
      const target = resume.projects.find((item) => item.id === result.targetId);
      if (target) updateResume({ projects: resume.projects.map((item) => item.id === target.id ? { ...item, description: result.bullets?.map((bullet) => `• ${bullet}`).join('\n') ?? item.description } : item) });
    } else if (result.kind === 'skills' && result.skills) {
      updateResume({ skills: [...new Set([...resume.skills, ...result.skills])] });
    } else if (result.kind === 'tailor') {
      const experienceById = new Map((result.experienceBullets ?? []).map((item) => [item.experienceId, item.bullets]));
      updateResume({
        ...(result.text ? { summary: result.text } : {}),
        ...(result.skills ? { skills: [...new Set([...resume.skills, ...result.skills])] } : {}),
        ...(result.experienceBullets ? { experience: resume.experience.map((item) => experienceById.has(item.id) ? { ...item, bullets: experienceById.get(item.id) ?? item.bullets } : item) } : {})
      });
    }
  };
  const sectionForm = selectedSection === 'personal' ? <PersonalForm /> : selectedSection === 'summary' ? <SummaryForm /> : selectedSection === 'experience' ? <ExperienceForm /> : selectedSection === 'education' ? <EducationForm /> : selectedSection === 'skills' ? <SkillsForm /> : selectedSection === 'projects' ? <ProjectsForm /> : <CertificationsForm />;
  const editorPanel = <Box className="editor-panel"><Box className="editor-heading"><Typography variant="h6">{selectedSection === 'personal' ? 'Personal details' : sectionLabels[selectedSection as SectionType]}</Typography><Typography variant="body2" color="text.secondary">Changes save automatically</Typography></Box><Box className="form-scroll">{sectionForm}</Box></Box>;
  const designPanel = <Box className="editor-panel"><Box className="editor-heading"><Typography variant="h6">Design & layout</Typography><Typography variant="body2" color="text.secondary">Make it yours</Typography></Box><Box className="form-scroll"><Typography variant="overline" color="text.secondary">Template</Typography><Box className="template-picker">{templates.map((item) => <Box key={item.id} className={`template-picker-option ${resume.template === item.id ? 'selected' : ''}`} onClick={() => setTemplate(item.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setTemplate(item.id); }}><TemplateThumbnail template={item.id} compact /><Box className="template-picker-copy"><Typography variant="body2" fontWeight={750}>{item.label}</Typography><Typography variant="caption" color="text.secondary">{item.description}</Typography></Box>{resume.template === item.id && <Chip label="Selected" size="small" color="primary" />}</Box>)}</Box><Typography variant="overline" color="text.secondary" display="block" mt={3}>Accent color</Typography><Stack direction="row" spacing={1.2} mt={1}>{colors.map((color) => <IconButton key={color} onClick={() => updateResume({ accentColor: color })} sx={{ bgcolor: color, width: 28, height: 28, border: resume.accentColor === color ? '3px solid #dbeafe' : 'none', '&:hover': { bgcolor: color } }} />)}</Stack><Typography variant="overline" color="text.secondary" display="block" mt={3}>Sections</Typography><Typography variant="caption" color="text.secondary" display="block" mb={1}>Drag to reorder sections on your resume.</Typography><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={resume.sections} strategy={verticalListSortingStrategy}>{resume.sections.map((section) => <SortableSection key={section} section={section} selected={false} onSelect={() => setSelectedSection(section)} />)}</SortableContext></DndContext></Box></Box>;

  return <Box className="app-shell">
    <AppBar position="static" color="inherit" elevation={0} className="topbar"><Toolbar><IconButton edge="start" onClick={() => setMobileMenu(!mobileMenu)} sx={{ display: { md: 'none' }, mr: 1 }}><MenuIcon size={20} /></IconButton><Box className="brand-mark"><Sparkles size={18} fill="currentColor" /><Typography fontWeight={800} letterSpacing="-0.5px">ResumeForge</Typography></Box><Button size="small" color="inherit" onClick={() => navigate('/dashboard')} sx={{ textTransform: 'none', ml: 1 }}>My Resumes</Button><Box className="topbar-title"><FileText size={16} color="#64748b" /><Typography variant="body2" noWrap>{activeTitle}</Typography><Chip label={saveState === 'saving' ? 'Saving…' : saveState === 'offline' ? 'Offline — saved locally' : 'Saved ✓'} size="small" color={saveState === 'offline' ? 'warning' : 'success'} variant="outlined" /></Box><Box flex={1} /><Button onClick={() => setAiOpen(true)} startIcon={<Sparkles size={16} />} variant="outlined" size="small">AI Assistant</Button><Tooltip title="Export PDF"><Button onClick={exportPdf} startIcon={<Download size={17} />} variant="contained" size="small">Export PDF</Button></Tooltip><IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}><MoreVertical size={19} /></IconButton><Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}><MenuItem onClick={async () => { try { const result = await duplicateCloudResume(activeId); navigate(`/resume/${result.resume.id}/edit`); } catch { duplicateResume(activeId); } setMenuAnchor(null); }}>Duplicate resume</MenuItem><MenuItem onClick={() => { if (window.confirm('Delete this resume?')) { deleteCloudResume(activeId).catch(() => undefined); deleteResume(activeId); navigate('/dashboard'); } setMenuAnchor(null); }}>Delete resume</MenuItem><MenuItem onClick={() => { logout(); navigate('/login'); setMenuAnchor(null); }}>Logout</MenuItem></Menu></Toolbar></AppBar>
    <Box className="workspace">
      <Drawer variant={isMobile ? 'temporary' : 'persistent'} open={isMobile ? mobileMenu : leftOpen} onClose={() => setMobileMenu(false)} className="left-drawer" ModalProps={{ keepMounted: true }}><Box className="drawer-inner"><Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}><Typography variant="overline" color="text.secondary">My resumes</Typography><Tooltip title="New resume"><IconButton size="small" onClick={addResume}><Plus size={17} /></IconButton></Tooltip></Stack><Stack spacing={.75}>{resumes.map((item) => <Box key={item.id} onClick={() => { setActive(item.id); setMobileMenu(false); }} className={`resume-list-item ${item.id === activeId ? 'active' : ''}`}><FileText size={16} /><Box minWidth={0}><Typography variant="body2" fontWeight={item.id === activeId ? 700 : 500} noWrap>{item.title}</Typography><Typography variant="caption" color="text.secondary">{new Date(item.updatedAt).toLocaleDateString()}</Typography></Box></Box>)}</Stack><Button startIcon={<FilePlus2 size={16} />} fullWidth variant="outlined" sx={{ mt: 2 }} onClick={addResume}>New resume</Button></Box></Drawer>
      {!isMobile && <IconButton className="collapse-left" onClick={() => setLeftOpen(!leftOpen)}>{leftOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</IconButton>}
      {(!isMobile || mobileMenu) && <Box className={`editor-side ${leftOpen ? 'with-library' : ''}`}><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth"><Tab icon={<FileText size={16} />} iconPosition="start" label="Edit" value="editor" /><Tab icon={<Palette size={16} />} iconPosition="start" label="Design" value="design" /></Tabs>{tab === 'editor' ? <><Box className="section-nav"><Box className={`section-nav-item ${selectedSection === 'personal' ? 'active' : ''}`} onClick={() => setSelectedSection('personal')}><span className="section-number">00</span>Personal details</Box><Divider />{resume.sections.map((section) => <Box key={section} className={`section-nav-item ${selectedSection === section ? 'active' : ''}`} onClick={() => setSelectedSection(section)}><span className="section-number">{sectionIcons[section]}</span>{sectionLabels[section]}</Box>)}</Box>{editorPanel}</> : designPanel}</Box>}
      <Box className="preview-area"><Box className="preview-toolbar"><Typography variant="caption" color="text.secondary">Preview</Typography><Box flex={1} /><Tooltip title={rightOpen ? 'Hide preview' : 'Show preview'}><IconButton size="small" onClick={() => setRightOpen(!rightOpen)}>{rightOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</IconButton></Tooltip></Box>{rightOpen && <Box className="preview-scroll"><ResumePreview resume={resume} /></Box>}{!rightOpen && <Alert severity="info" sx={{ m: 3 }}>Preview is hidden. Click the panel icon to show it.</Alert>}</Box>
    </Box>
    <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} resume={resume} onApply={applyAiResult} />
  </Box>;
}

export default ResumeBuilder;
