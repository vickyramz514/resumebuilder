import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeBuilder from './pages/ResumeBuilder';
import PublicResumePage from './pages/PublicResumePage';
import LandingPage from './pages/LandingPage';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.GOOGLE_CLIENT_ID ?? '';

function App() {
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);
  const routes = <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/r/:slug" element={<PublicResumePage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/resume/new" element={<ResumeBuilder />} />
      <Route path="/resume/:id" element={<ResumeBuilder />} />
      <Route path="/resume/:id/edit" element={<ResumeBuilder />} />
    </Route>
    <Route path="/" element={<LandingPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
  return googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{routes}</GoogleOAuthProvider> : routes;
}

export default App;
