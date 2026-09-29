import { useEffect, useState } from 'react';
import {
  Alert, AppBar, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Menu, MenuItem,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, Toolbar, Typography
} from '@mui/material';
import { ChevronDown, CreditCard, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { adminOverview, type AdminOverview } from '../services/adminApi';
import '../dashboard.css';

function money(cents: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function when(value: string) {
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    adminOverview()
      .then(setData)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load admin data'));
  }, []);

  const peak = Math.max(1, ...(data?.signups.map((day) => day.count) ?? [1]));

  return <Box className="dashboard-page" sx={{ minHeight: '100vh', bgcolor: '#f6f7fb', color: '#202124' }}>
    <AppBar position="static" elevation={0} className="dashboard-topbar" sx={{ bgcolor: '#fff', color: '#202124', borderBottom: '1px solid #e5e9e6' }}>
      <Toolbar sx={{ maxWidth: 1180, width: '100%', mx: 'auto' }}>
        <Box className="brand-mark"><Box className="brand-badge"><Sparkles size={16} fill="currentColor" /></Box><Typography component="span" fontWeight={800} letterSpacing="-0.5px">ResumeForge</Typography></Box>
        <Box flex={1} />
        <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>My Resumes</Button>
        <Box className="user-chip" onClick={(event) => setMenuAnchor(event.currentTarget)}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: '#0d9488' }}>{(user?.name || 'A').slice(0, 1).toUpperCase()}</Avatar>
          <Typography variant="body2" fontWeight={650} noWrap maxWidth={140}>{user?.name}</Typography>
          <ChevronDown size={15} />
        </Box>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { setMenuAnchor(null); navigate('/dashboard'); }}><LayoutDashboard size={15} />&nbsp; My Resumes</MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); navigate('/billing'); }}><CreditCard size={15} />&nbsp; Billing</MenuItem>
          <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ color: 'error.main' }}><LogOut size={15} />&nbsp; Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>

    <Box maxWidth={1180} mx="auto" px={{ xs: 2, sm: 3 }} py={{ xs: 3, sm: 5 }}>
      <Box mb={3}>
        <Typography variant="overline" color="#0d9488" fontWeight={800}>Admin</Typography>
        <Typography variant="h3" fontWeight={750} letterSpacing="-1.5px">Users and payments</Typography>
        <Typography color="#626871">This account can use every layout, download, and the AI assistant.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {!data && !error && <Box textAlign="center" py={8}><CircularProgress color="inherit" /></Box>}
      {data && <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
          {[
            ['Users', String(data.totals.users), `${data.totals.signupsWeek} this week`],
            ['Paid subscriptions', String(data.totals.activeSubscriptions), `${data.totals.signupsMonth} signups in 30 days`],
            ['Resumes', String(data.totals.resumes), 'Saved in the library'],
            ['Collected', money(data.totals.revenueCents), `${data.totals.completedPayments} completed · ${data.totals.failedPayments} failed`]
          ].map(([label, value, hint]) => (
            <Card key={label} variant="outlined" sx={{ borderColor: '#D0D3D6' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
                <Typography variant="h5" fontWeight={750}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{hint}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card variant="outlined" sx={{ borderColor: '#D0D3D6', mb: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontWeight={750}>Signups, last 14 days</Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap">{data.plans.map((row) => <Chip key={row.plan} size="small" label={`${row.plan} ${row.count}`} />)}</Stack>
            </Stack>
            <Stack direction="row" alignItems="flex-end" spacing={0.75} sx={{ height: 96 }}>
              {data.signups.map((day) => (
                <Box key={day.day} title={`${day.day}: ${day.count}`} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <Box sx={{ width: '100%', maxWidth: 28, height: `${Math.max(6, (day.count / peak) * 100)}%`, bgcolor: day.count ? '#0d9488' : '#e5e9e6', borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
            <Stack direction="row" justifyContent="space-between" mt={0.75}>
              <Typography variant="caption" color="text.secondary">{data.signups[0]?.day.slice(5)}</Typography>
              <Typography variant="caption" color="text.secondary">{data.signups.at(-1)?.day.slice(5)} · {data.totals.pendingPayments} payments still pending</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderColor: '#D0D3D6', mb: 2, overflow: 'auto' }}>
          <CardContent>
            <Typography fontWeight={750} mb={1}>Recent users</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Resumes</TableCell>
                  <TableCell>Payments</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.users.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>{person.name}{person.role === 'ADMIN' ? ' · Admin' : ''}</TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>{person.plan}</TableCell>
                    <TableCell>{person._count.resumes}</TableCell>
                    <TableCell>{person._count.payments}</TableCell>
                    <TableCell>{when(person.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderColor: '#D0D3D6', overflow: 'auto' }}>
          <CardContent>
            <Typography fontWeight={750} mb={1}>Recent payments</Typography>
            {data.payments.length ? <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.user.name}<Typography variant="caption" display="block" color="text.secondary">{payment.user.email}</Typography></TableCell>
                    <TableCell>{money(payment.amountCents, payment.currency)}</TableCell>
                    <TableCell>{payment.status}</TableCell>
                    <TableCell>{payment.provider}</TableCell>
                    <TableCell>{when(payment.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table> : <Typography color="text.secondary">No payments yet.</Typography>}
          </CardContent>
        </Card>
      </>}
    </Box>
  </Box>;
}
