import { useEffect, useState } from 'react';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from './LoginPage';
import { useAuthStore } from '../store/authStore';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function RegisterPage() {
  const navigate = useNavigate(); const { isAuthenticated, register, loginWithGoogle, isLoading, error } = useAuthStore();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }); }, [isAuthenticated, navigate]);
  return <AuthLayout title="Create your account" subtitle="Your next opportunity starts with a great resume.">
    <Stack component="form" spacing={2.25} onSubmit={async (event) => { event.preventDefault(); try { await register(name, email, password); } catch { /* rendered below */ } }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required inputProps={{ minLength: 2 }} autoComplete="name" autoFocus />
      <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
      <TextField
        label="Password" type={showPassword ? 'text' : 'password'} value={password}
        onChange={(event) => setPassword(event.target.value)} required helperText="At least 8 characters" autoComplete="new-password"
        slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end" tabIndex={-1}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</IconButton></InputAdornment> } }}
      />
      <Button type="submit" variant="contained" size="large" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}</Button>
      <Box className="auth-divider">or continue with</Box>
      <GoogleSignInButton disabled={isLoading} onCredential={async (credential) => { try { await loginWithGoogle(credential); } catch { /* rendered below */ } }} />
      <Typography textAlign="center" variant="body2">Already have an account? <Link to="/login">Sign in</Link></Typography>
    </Stack>
  </AuthLayout>;
}
