import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, AppBar, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, IconButton, InputAdornment, Menu, MenuItem, Stack, TextField, Toolbar,
  Tooltip, Typography
} from '@mui/material';
import { ChevronDown, Clock, Copy, CreditCard, ExternalLink, FileText, FolderOpen, LogOut, MoreHorizontal, Plus, Search, Share2, Sparkles, Trash2, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store';
import { createResume, deleteResume, duplicateResume, listResumes, renameResume, shareResume, type CloudResume } from '../services/resumeApi';
import { ApiError } from '../services/api';
import { normalizeImportedResume } from '../utils/importResume';
import { TemplateThumbnail } from '../components/TemplateThumbnail';
import { TEMPLATE_CATALOG, isPaidTemplate, isTemplateId } from '../templates/catalog';
import { PaywallDialog } from '../components/PaywallDialog';
import { hasPaidPlan } from '../utils/entitlements';
import type { Resume, TemplateId } from '../types';
import '../dashboard.css';

const consumedTemplateQuery = new Set<string>();

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [resumes, setResumes] = useState<CloudResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [rename, setRename] = useState<CloudResume | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [share, setShare] = useState<CloudResume | null>(null);
  const [importResume, setImportResume] = useState<Resume | null>(null);
  const [actionResume, setActionResume] = useState<CloudResume | null>(null);
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'template' | null>(null);
  const [importing, setImporting] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localResumes = useResumeStore((state) => state.resumes);
  const replaceResume = useResumeStore((state) => state.replaceResume);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setResumes((await listResumes()).resumes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (loading || importResume) return;
    const pendingId = sessionStorage.getItem('resumeforge_pending_import');
    const dismissedId = sessionStorage.getItem('resumeforge_dismissed_import');
    const pendingResume = pendingId
      ? localResumes.find((item) => item.id === pendingId)
      : !resumes.length ? localResumes.find((item) => item.id !== 'sample-resume' && item.id !== dismissedId) : undefined;
    if (pendingResume) setImportResume(pendingResume);
  }, [loading, resumes.length, localResumes, importResume]);

  const create = async (templateId?: TemplateId) => {
    if (templateId && isPaidTemplate(templateId) && !hasPaidPlan(user)) {
      setTemplateDialog(false);
      setPaywallReason('template');
      return;
    }
    try {
      const result = await createResume(templateId ? { templateId } : undefined);
      setTemplateDialog(false);
      navigate(`/resume/${result.resume.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create resume');
    }
  };

  useEffect(() => {
    const template = searchParams.get('template') as TemplateId | null;
    if (!template || loading || consumedTemplateQuery.has(template)) return;
    if (!isTemplateId(template)) return;
    consumedTemplateQuery.add(template);
    void create(template);
  }, [searchParams, loading]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const resume = normalizeImportedResume(JSON.parse(await file.text()));
      replaceResume(resume);
      sessionStorage.setItem('resumeforge_pending_import', resume.id);
      setImportResume(resume);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not read that JSON file.');
    } finally {
      setImporting(false);
    }
  };

  const remove = async (resume: CloudResume) => {
    if (!window.confirm('Delete this resume?\n\nThis action cannot be undone.')) return;
    try {
      await deleteResume(resume.id);
      setResumes((items) => items.filter((item) => item.id !== resume.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete resume');
    }
  };
  const duplicate = async (resume: CloudResume) => {
    try {
      const result = await duplicateResume(resume.id);
      navigate(`/resume/${result.resume.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to duplicate resume');
    }
  };
  const submitRename = async () => {
    if (!rename || !renameValue.trim()) return;
    try {
      const result = await renameResume(rename.id, renameValue.trim());
      setResumes((items) => items.map((item) => item.id === rename.id ? result.resume : item));
      setRename(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to rename resume');
    }
  };
  const toggleShare = async () => {
    if (!share) return;
    try {
      const result = await shareResume(share.id, !share.isPublic);
      setResumes((items) => items.map((item) => item.id === share.id ? result.resume : item));
      setShare(result.resume);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update sharing');
    }
  };
  const shareUrl = share?.publicSlug ? `${window.location.origin}/r/${share.publicSlug}` : '';
  const closeActions = () => { setActionAnchor(null); setActionResume(null); };
  const needle = query.trim().toLowerCase();
  const sorted = [...resumes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .filter((resume) => !needle || resume.title.toLowerCase().includes(needle) || resume.templateId.toLowerCase().includes(needle));

  return <Box className="dashboard-page" sx={{ minHeight: '100vh', bgcolor: '#F7F7F5', color: '#202124' }}>
    <AppBar position="static" elevation={0} className="dashboard-topbar" sx={{ bgcolor: '#fff', color: '#202124', borderBottom: '1px solid #e5e9e6' }}>
      <Toolbar sx={{ maxWidth: 1180, width: '100%', mx: 'auto' }}>
        <Box className="brand-mark"><Box className="brand-badge"><Sparkles size={16} fill="currentColor" /></Box><Typography component="span" fontWeight={800} letterSpacing="-0.5px" sx={{ display: { xs: 'none', sm: 'inline' } }}>ResumeForge</Typography></Box>
        <Box flex={1} />
        <Box className="user-chip" onClick={(event) => setUserMenuAnchor(event.currentTarget)}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: '#255c4b' }}>{(user?.name || 'U').slice(0, 1).toUpperCase()}</Avatar>
          <Typography variant="body2" fontWeight={650} sx={{ display: { xs: 'none', sm: 'inline' } }} noWrap maxWidth={140}>{user?.name}</Typography>
          <ChevronDown size={15} />
        </Box>
        <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <Box px={2} py={1.25} sx={{ borderBottom: '1px solid #eef1ee' }}><Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography><Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography></Box>
          <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/billing'); }} sx={{ gap: 1 }}><CreditCard size={15} /> Billing</MenuItem>
          <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ color: 'error.main', gap: 1 }}><LogOut size={15} /> Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>

    <Box className="dashboard-content" maxWidth={1180} mx="auto" px={{ xs: 2, sm: 3 }} py={{ xs: 3, sm: 6 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={3} className="dashboard-heading">
        <Box>
          <Typography variant="overline" color="#255c4b" fontWeight={800}>Your workspace</Typography>
          <Typography variant="h3" fontWeight={750} letterSpacing="-1.5px">My Resumes</Typography>
          <Typography color="#626871">Choose a starting point, then build a resume you feel good sending.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <TextField
            size="small"
            placeholder="Search resumes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
            sx={{ minWidth: { sm: 220 }, bgcolor: '#fff' }}
          />
          <Button variant="outlined" startIcon={<Upload size={17} />} onClick={() => inputRef.current?.click()} disabled={importing}>
            {importing ? 'Reading file…' : 'Import existing'}
          </Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => create()}>New resume</Button>
          <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </Stack>
      </Stack>

      <Card className="quick-actions" variant="outlined" sx={{ mb: 4, borderColor: '#D0D3D6', bgcolor: '#fff' }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle1" fontWeight={750}>Start your next version</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Not sure where to begin? Pick the path that fits you best.</Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}><Button className="quick-action" fullWidth variant="outlined" onClick={() => create()}><Box className="quick-action-icon icon-scratch"><Plus size={18} /></Box><Box textAlign="left"><strong>Start from scratch</strong><small>A guided blank canvas</small></Box></Button></Grid>
            <Grid item xs={12} sm={4}><Button className="quick-action" fullWidth variant="outlined" onClick={() => inputRef.current?.click()}><Box className="quick-action-icon icon-import"><FolderOpen size={18} /></Box><Box textAlign="left"><strong>Bring an existing resume</strong><small>Import a ResumeForge JSON file</small></Box></Button></Grid>
            <Grid item xs={12} sm={4}><Button className="quick-action" fullWidth variant="outlined" onClick={() => setTemplateDialog(true)}><Box className="quick-action-icon icon-browse"><FileText size={18} /></Box><Box textAlign="left"><strong>Browse templates</strong><small>Find a layout that fits your story</small></Box></Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Box className="dashboard-loading" textAlign="center" py={8}><CircularProgress color="inherit" /><Typography variant="body2" color="text.secondary" mt={2}>Loading your library…</Typography></Box> : resumes.length ? (
        sorted.length ? <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}><Typography variant="h6" fontWeight={750}>Your saved resumes</Typography><Typography variant="body2" color="text.secondary">{sorted.length} {sorted.length === 1 ? 'resume' : 'resumes'}{query.trim() ? ' matching' : ''}</Typography></Stack>
        <Grid container spacing={2.5}>{sorted.map((resume) => <Grid item xs={12} sm={6} md={4} key={resume.id}>
          <Card className="resume-card" variant="outlined" sx={{ height: '100%', borderColor: '#D0D3D6', bgcolor: '#fff', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box className={`resume-card-thumb preview-${resume.templateId}`}>
                <TemplateThumbnail template={isTemplateId(resume.templateId) ? resume.templateId : 'professional'} compact />
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1}>
                <Box minWidth={0}>
                  <Typography fontWeight={700} mt={2} noWrap>{resume.title}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} className="resume-card-meta"><Clock size={12} /><Typography variant="caption" component="span">Updated {new Date(resume.updatedAt).toLocaleDateString()}</Typography></Stack>
                </Box>
                <Tooltip title="More actions"><IconButton className="card-menu-btn" size="small" aria-label={`More actions for ${resume.title}`} onClick={(event) => { setActionResume(resume); setActionAnchor(event.currentTarget); }}><MoreHorizontal size={18} /></IconButton></Tooltip>
              </Stack>
              <Stack direction="row" spacing={1} mt={1.5}><Chip className="template-chip" label={resume.templateId} size="small" /><Chip label={resume.isPublic ? 'Shared' : 'Private'} size="small" color={resume.isPublic ? 'success' : 'default'} variant="outlined" /></Stack>
              <Stack direction="row" spacing={1} mt={2}><Button fullWidth variant="contained" size="small" onClick={() => navigate(`/resume/${resume.id}/edit`)}>Continue editing</Button><Button size="small" variant="outlined" startIcon={<Share2 size={14} />} onClick={() => setShare(resume)}>Share</Button></Stack>
            </CardContent>
          </Card>
        </Grid>)}</Grid>
      </> : <Alert severity="info" sx={{ mb: 3 }}>No resumes match “{query}”. Try a different name or template.</Alert>
      ) : <Card className="dashboard-empty" variant="outlined" sx={{ p: { xs: 3, sm: 7 }, textAlign: 'center', borderStyle: 'dashed', bgcolor: 'transparent' }}>
        <Box className="empty-state-icon"><Box className="empty-state-ring" /><Box className="empty-state-badge"><FileText size={26} /></Box></Box>
        <Typography variant="h6" fontWeight={750}>Your resume library is empty</Typography><Typography color="#626871" mb={2}>Start fresh, import an existing file, or browse templates.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={1}><Button variant="contained" startIcon={<Plus size={17} />} onClick={() => create()}>Create your first resume</Button><Button variant="outlined" onClick={() => setTemplateDialog(true)}>Browse templates</Button></Stack>
      </Card>}
    </Box>

    <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={closeActions}>
      <MenuItem onClick={() => { if (actionResume) navigate(`/resume/${actionResume.id}/edit`); closeActions(); }}>Continue editing</MenuItem>
      <MenuItem onClick={() => { if (actionResume) duplicate(actionResume); closeActions(); }}>Duplicate</MenuItem>
      <MenuItem onClick={() => { if (actionResume) { setRename(actionResume); setRenameValue(actionResume.title); } closeActions(); }}>Rename</MenuItem>
      <MenuItem onClick={() => { if (actionResume) setShare(actionResume); closeActions(); }}>Share settings</MenuItem>
      <MenuItem onClick={() => { if (actionResume) remove(actionResume); closeActions(); }} sx={{ color: 'error.main' }}><Trash2 size={15} />&nbsp; Delete</MenuItem>
    </Menu>

    <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} fullWidth maxWidth="lg">
      <DialogTitle className="dialog-title-icon"><Box className="dialog-icon-badge"><FileText size={16} /></Box>Choose a starting template</DialogTitle>
      <DialogContent><Typography color="text.secondary" variant="body2" mb={2}>Free layouts are ready now. Gold-framed Pro layouts need a subscription.</Typography><Grid container spacing={1.5}>{TEMPLATE_CATALOG.map((template) => <Grid item xs={12} sm={6} md={3} key={template.id}><Card className={`template-choice${template.tier === 'paid' ? ' is-paid' : ''}`} variant="outlined" onClick={() => create(template.id)} sx={{ cursor: 'pointer', p: 1.25, height: '100%' }}><TemplateThumbnail template={template.id} compact /><Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}><Typography fontWeight={750}>{template.label}</Typography><Chip size="small" label={template.tier === 'paid' ? 'Pro' : 'Free'} color={template.tier === 'paid' ? 'warning' : 'success'} variant="outlined" /></Stack><Typography variant="caption" color="text.secondary">{template.description}</Typography><Button size="small" sx={{ mt: 1 }} onClick={(event) => { event.stopPropagation(); create(template.id); }}>{template.tier === 'paid' ? 'Unlock' : 'Use this template'}</Button></Card></Grid>)}</Grid></DialogContent>
      <DialogActions><Button onClick={() => setTemplateDialog(false)}>Cancel</Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(rename)} onClose={() => setRename(null)}><DialogTitle className="dialog-title-icon"><Box className="dialog-icon-badge"><FileText size={16} /></Box>Rename resume</DialogTitle><DialogContent><TextField autoFocus fullWidth label="Resume title" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} sx={{ mt: 1 }} /></DialogContent><DialogActions><Button onClick={() => setRename(null)}>Cancel</Button><Button variant="contained" onClick={submitRename} disabled={!renameValue.trim()}>Save name</Button></DialogActions></Dialog>
    <Dialog open={Boolean(share)} onClose={() => setShare(null)}><DialogTitle className="dialog-title-icon"><Box className="dialog-icon-badge"><Share2 size={16} /></Box>Share resume</DialogTitle><DialogContent>{share?.isPublic ? <Stack spacing={2} pt={1}><Typography variant="body2">Anyone with this link can view your resume.</Typography><TextField fullWidth value={shareUrl} InputProps={{ readOnly: true }} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button startIcon={<Copy size={15} />} onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy link</Button><Button startIcon={<ExternalLink size={15} />} onClick={() => window.open(shareUrl, '_blank')}>Open resume</Button></Stack></Stack> : <Typography py={1}>Your resume is private. Enable sharing to create a public link.</Typography>}</DialogContent><DialogActions><Button onClick={() => setShare(null)}>Close</Button><Button variant="contained" onClick={toggleShare}>{share?.isPublic ? 'Disable sharing' : 'Enable sharing'}</Button></DialogActions></Dialog>
    <PaywallDialog open={paywallReason === 'template'} reason="template" onClose={() => setPaywallReason(null)} />
    <Dialog open={Boolean(importResume)} onClose={() => setImportResume(null)}><DialogTitle className="dialog-title-icon"><Box className="dialog-icon-badge"><Upload size={16} /></Box>Resume ready to import</DialogTitle><DialogContent><Typography>Save <strong>{importResume?.title}</strong> to your cloud resume library so you can keep editing it anywhere?</Typography></DialogContent><DialogActions><Button onClick={() => { sessionStorage.removeItem('resumeforge_pending_import'); if (importResume) sessionStorage.setItem('resumeforge_dismissed_import', importResume.id); setImportResume(null); }}>Not now</Button><Button variant="contained" onClick={async () => { if (!importResume) return; try { const result = await createResume({ title: importResume.title, data: importResume, templateId: importResume.template }); setResumes((items) => [result.resume, ...items]); sessionStorage.removeItem('resumeforge_pending_import'); sessionStorage.removeItem('resumeforge_dismissed_import'); setImportResume(null); } catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to import resume'); } }}>Import to My Resumes</Button></DialogActions></Dialog>
  </Box>;
}
