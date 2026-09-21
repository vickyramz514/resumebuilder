import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const navigate = useNavigate(); const location = useLocation();
  const { isAuthenticated, login, loginWithGoogle, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  useEffect(() => { if (isAuthenticated) navigate((location.state as any)?.from || '/dashboard', { replace: true }); }, [isAuthenticated, navigate, location.state]);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AuthLayout title="Welcome back" subtitle="Sign in to continue building your resume.">
    <Stack component="form" spacing={2} onSubmit={async (event) => { event.preventDefault(); try { await login(email, password); } catch { /* rendered below */ } }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
      <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
      <Button type="submit" variant="contained" size="large" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</Button>
      <Typography textAlign="center" variant="body2" color="text.secondary">or continue with</Typography>
      <GoogleSignInButton disabled={isLoading} onCredential={async (credential) => { try { await loginWithGoogle(credential); } catch { /* rendered below */ } }} />
      <Typography textAlign="center" variant="body2">New to ResumeForge? <Link to="/register">Create an account</Link></Typography>
    </Stack>
  </AuthLayout>;
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Box sx={{ minHeight: '100vh', bgcolor: '#F7F7F5', display: 'grid', placeItems: 'center', p: 2 }}><Paper elevation={0} sx={{ width: '100%', maxWidth: 430, p: { xs: 3, sm: 5 }, border: '1px solid #D0D3D6', borderRadius: 3 }}><Typography fontWeight={800} fontSize={20} sx={{ mb: 5 }}>✦ ResumeForge</Typography><Typography variant="h4" fontWeight={750} letterSpacing="-1px">{title}</Typography><Typography color="#626871" sx={{ mb: 3 }}>{subtitle}</Typography>{children}</Paper></Box>;
}
