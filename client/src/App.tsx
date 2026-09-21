import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeBuilder from './pages/ResumeBuilder';
import PublicResumePage from './pages/PublicResumePage';

function App() {
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/r/:slug" element={<PublicResumePage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/resume/new" element={<ResumeBuilder />} />
      <Route path="/resume/:id" element={<ResumeBuilder />} />
      <Route path="/resume/:id/edit" element={<ResumeBuilder />} />
    </Route>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></BrowserRouter>;
}

export default App;
