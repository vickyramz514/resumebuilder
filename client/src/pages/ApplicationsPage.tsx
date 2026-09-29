import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, AppBar, Avatar, Box, Button, Chip, CircularProgress, Menu, MenuItem, Stack, TextField, Toolbar, Typography
} from '@mui/material';
import { Briefcase, ChevronDown, CreditCard, ExternalLink, LogOut, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAuthStore } from '../store/authStore';
import { isAdminUser, planCategory } from '../utils/entitlements';
import {
  createApplication, deleteApplication, listApplications, updateApplication,
  type ApplicationSource, type ApplicationStatus, type JobApplication
} from '../services/applicationApi';
import '../dashboard.css';

const STATUSES: { id: ApplicationStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'SAVED', label: 'Saved' },
  { id: 'APPLIED', label: 'Applied' },
  { id: 'INTERVIEW', label: 'Interview' },
  { id: 'OFFER', label: 'Offer' },
  { id: 'CLOSED', label: 'Closed' }
];

const SOURCE_LABEL: Record<ApplicationSource, string> = {
  NAUKRI: 'Naukri',
  LINKEDIN: 'LinkedIn',
  OTHER: 'Other'
};

function formatWhen(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [items, setItems] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [url, setUrl] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems((await listApplications()).applications);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(
    () => items.filter((item) => filter === 'ALL' || item.status === filter),
    [items, filter]
  );

  const add = async () => {
    const link = url.trim();
    if (!link) return;
    setSaving(true);
    setError('');
    try {
      const result = await createApplication({ url: link, role: role.trim(), company: company.trim(), notes: notes.trim() });
      setItems((current) => [result.application, ...current]);
      setUrl('');
      setRole('');
      setCompany('');
      setNotes('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this job');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (item: JobApplication, status: ApplicationStatus) => {
    const previous = item.status;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
    try {
      const result = await updateApplication(item.id, { status });
      setItems((current) => current.map((entry) => entry.id === item.id ? result.application : entry));
    } catch (cause) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: previous } : entry));
      setError(cause instanceof Error ? cause.message : 'Unable to update this application');
    }
  };

  const remove = async (item: JobApplication) => {
    if (!window.confirm('Remove this job from your list?')) return;
    try {
      await deleteApplication(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove this application');
    }
  };

  return <Box className="dashboard-page" sx={{ minHeight: '100vh', bgcolor: '#f3f6f4', color: '#202124' }}>
    <AppBar position="static" elevation={0} className="dashboard-topbar" sx={{ bgcolor: '#fff', color: '#202124', borderBottom: '1px solid #e5e9e6' }}>
      <Toolbar sx={{ maxWidth: 1180, width: '100%', mx: 'auto' }}>
        <Box className="brand-mark" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}><BrandLogo /><Typography component="span" fontWeight={800} letterSpacing="-0.5px" sx={{ display: { xs: 'none', sm: 'inline' } }}>ResumeForge</Typography></Box>
        <Box flex={1} />
        <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>My Resumes</Button>
        {isAdminUser(user) && <Button color="inherit" onClick={() => navigate('/admin')} sx={{ mr: 1 }}>Track</Button>}
        <Chip size="small" label={planCategory(user?.plan).label} color={planCategory(user?.plan).color} variant="outlined" sx={{ mr: 1 }} />
        <Box className="user-chip" onClick={(event) => setUserMenuAnchor(event.currentTarget)}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: '#0d9488' }}>{(user?.name || 'U').slice(0, 1).toUpperCase()}</Avatar>
          <Typography variant="body2" fontWeight={650} sx={{ display: { xs: 'none', sm: 'inline' } }} noWrap maxWidth={140}>{user?.name}</Typography>
          <ChevronDown size={15} />
        </Box>
        <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <Box px={2} py={1.25} sx={{ borderBottom: '1px solid #eef1ee' }}><Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography><Typography variant="caption" color="text.secondary" display="block" noWrap>{user?.email}</Typography></Box>
          <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/billing'); }} sx={{ gap: 1 }}><CreditCard size={15} /> Billing</MenuItem>
          <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ color: 'error.main', gap: 1 }}><LogOut size={15} /> Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>

    <Box className="dashboard-content" maxWidth={1180} mx="auto" px={{ xs: 2, sm: 3 }} py={{ xs: 3, sm: 5 }}>
      <Box className="dashboard-heading" mb={3}>
        <Typography variant="overline" color="#0d9488" fontWeight={800}>Your applications</Typography>
        <Typography variant="h3" fontWeight={750} letterSpacing="-1.5px">Job tracker</Typography>
        <Typography color="#626871" maxWidth={560}>Save a Naukri or LinkedIn link, apply on that site yourself, then mark it Applied here.</Typography>
      </Box>

      <Box className="application-form" component="form" onSubmit={(event) => { event.preventDefault(); void add(); }}>
        <TextField label="Job link" required fullWidth value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.naukri.com/job-listings-… or a LinkedIn job link" />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField label="Role" fullWidth value={role} onChange={(event) => setRole(event.target.value)} placeholder="Frontend engineer" />
          <TextField label="Company" fullWidth value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" />
        </Stack>
        <TextField label="Note" fullWidth value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional reminder for yourself" />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">This list only remembers the job. It does not submit the application.</Typography>
          <Button className="dash-btn dash-btn-primary" type="submit" variant="contained" startIcon={<Plus size={16} />} disabled={saving || !url.trim()}>{saving ? 'Saving…' : 'Save job'}</Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
        {STATUSES.map((status) => <Chip key={status.id} label={status.label} clickable color={filter === status.id ? 'primary' : 'default'} variant={filter === status.id ? 'filled' : 'outlined'} onClick={() => setFilter(status.id)} />)}
      </Stack>

      {loading ? <Box className="dashboard-loading" textAlign="center" py={8}><CircularProgress color="inherit" /><Typography variant="body2" color="text.secondary" mt={2}>Loading your applications…</Typography></Box> : error && !items.length ? null : visible.length ? (
        <Stack spacing={1.5}>
          {visible.map((item) => <Box key={item.id} className="application-row">
            <Box className="application-copy">
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={750}>{item.role}</Typography>
                <Chip size="small" label={SOURCE_LABEL[item.source]} className="template-chip" />
              </Stack>
              <Typography variant="body2" color="text.secondary">{[item.company, item.appliedAt ? `Applied ${formatWhen(item.appliedAt)}` : `Saved ${formatWhen(item.createdAt)}`].filter(Boolean).join(' · ')}</Typography>
              {item.notes && <Typography variant="body2" color="#3d4a45" mt={0.5}>{item.notes}</Typography>}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" className="application-actions">
              <TextField select size="small" label="Status" value={item.status} onChange={(event) => void setStatus(item, event.target.value as ApplicationStatus)} sx={{ minWidth: 140 }}>
                {STATUSES.filter((status) => status.id !== 'ALL').map((status) => <MenuItem key={status.id} value={status.id}>{status.label}</MenuItem>)}
              </TextField>
              <Button className="dash-btn dash-btn-ghost" variant="outlined" startIcon={<ExternalLink size={15} />} href={item.url} target="_blank" rel="noreferrer">Open</Button>
              <Button className="dash-btn dash-btn-ghost" variant="outlined" aria-label={`Remove ${item.role}`} onClick={() => void remove(item)}><Trash2 size={15} /></Button>
            </Stack>
          </Box>)}
        </Stack>
      ) : <Box className="dashboard-empty" textAlign="center" py={8} px={2}>
        <Box className="empty-state-icon"><span className="empty-state-ring" /><span className="empty-state-badge"><Briefcase size={22} /></span></Box>
        <Typography variant="h6" fontWeight={750}>{filter === 'ALL' ? 'No jobs saved yet' : 'Nothing in this status'}</Typography>
        <Typography color="text.secondary" mt={0.5}>Paste a job link above. Apply on Naukri or LinkedIn, then set the status to Applied.</Typography>
      </Box>}
    </Box>
  </Box>;
}
