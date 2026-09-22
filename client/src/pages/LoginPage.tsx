import { useEffect, useState } from 'react';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, Sparkles } from 'lucide-react';import { useAuthStore } from '../store/authStore';
import GoogleSignInButton from '../components/GoogleSignInButton';
import '../auth.css';

const FEATURES = ['Six polished, genuinely different templates', 'Auto-save with real-time preview', 'One-click PDF export, ATS-friendly'];

export default function LoginPage() {
  const navigate = useNavigate(); const location = useLocation();
  const { isAuthenticated, login, loginWithGoogle, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { if (isAuthenticated) navigate((location.state as any)?.from || '/dashboard', { replace: true }); }, [isAuthenticated, navigate, location.state]);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AuthLayout title="Welcome back" subtitle="Sign in to keep building your resume.">
    <Stack component="form" spacing={2.25} onSubmit={async (event) => { event.preventDefault(); try { await login(email, password); } catch { /* rendered below */ } }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" autoFocus />
      <TextField
        label="Password" type={showPassword ? 'text' : 'password'} value={password}
        onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password"
        slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end" tabIndex={-1}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</IconButton></InputAdornment> } }}
      />
      <Button type="submit" variant="contained" size="large" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</Button>
      <Box className="auth-divider">or continue with</Box>
      <GoogleSignInButton disabled={isLoading} onCredential={async (credential) => { try { await loginWithGoogle(credential); } catch { /* rendered below */ } }} />
      <Typography textAlign="center" variant="body2" color="text.secondary">New to ResumeForge? <Link to="/register">Create an account</Link></Typography>
    </Stack>
  </AuthLayout>;
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Box className="auth-page">
    <Box className="auth-brand-panel">
      <Link to="/" className="auth-brand-top" style={{ color: 'inherit', textDecoration: 'none' }}>
        <Box className="auth-brand-icon"><Sparkles size={16} fill="currentColor" /></Box>ResumeForge
      </Link>
      <Box className="auth-brand-mid">
        <Typography component="h2">Build a resume that opens doors.</Typography>
        <Typography component="p">A calm, guided editor with genuinely different templates, live preview, and one-click export — no design skills required.</Typography>
        <Box component="ul" className="auth-feature-list">
          {FEATURES.map((feature) => <li key={feature}><span><Check size={13} /></span>{feature}</li>)}
        </Box>
      </Box>
      <Box className="auth-quote">
        <Typography component="p">"I went from a blank page to an interview-ready resume in under an hour. The templates actually look designed, not templated."</Typography>
        <Typography component="footer">— Early ResumeForge user</Typography>
      </Box>
    </Box>
    <Box className="auth-form-panel">
      <Box className="auth-form-card">
        <Link to="/" className="auth-mobile-brand"><span><Sparkles size={15} fill="currentColor" /></span>ResumeForge</Link>
        <Typography className="auth-form-title">{title}</Typography>
        <Typography className="auth-form-subtitle">{subtitle}</Typography>
        {children}
      </Box>
    </Box>
  </Box>;
}
