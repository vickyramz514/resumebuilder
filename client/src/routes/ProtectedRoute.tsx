import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  if (!authenticated && isLoading && (token || localStorage.getItem('resumeforge_token'))) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#626871' }}>Loading your workspace…</Box>;
  }
  return authenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default ProtectedRoute;
