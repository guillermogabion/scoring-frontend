import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import EventDetailPage from './pages/EventDetailPage';
import ResultsPage from './pages/ResultsPage';
import JudgeScoringPage from './pages/JudgeScoringPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SuperAdminPage from './pages/SuperAdminPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/judge/:token" element={<JudgeScoringPage />} />
      <Route path="/events/:id/leaderboard" element={<LeaderboardPage />} />

      {/* Private */}
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/events/:id" element={<PrivateRoute><EventDetailPage /></PrivateRoute>} />
      <Route path="/events/:id/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />

      {/* Super Admin */}
      <Route path="/admin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}