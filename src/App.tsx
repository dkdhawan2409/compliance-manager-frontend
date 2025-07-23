import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './theme/theme';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Compliance from './pages/Compliance';
import AdminCompanyList from './pages/AdminCompanyList';
import AdminNotify from './pages/AdminNotify';
import AdminSettings from './pages/AdminSettings';
import AdminCronSettings from './pages/AdminCronSettings';
import AdminNotificationSettings from './pages/AdminNotificationSettings';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compliance"
                element={
                  <ProtectedRoute>
                    <Compliance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <ProtectedRoute>
                    <AdminCompanyList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notify"
                element={
                  <ProtectedRoute>
                    <AdminNotify />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cron-settings"
                element={
                  <ProtectedRoute>
                    <AdminCronSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance-deadlines"
                element={
                  <ProtectedRoute>
                    <AdminCronSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cronjob-settings"
                element={
                  <ProtectedRoute>
                    <AdminNotificationSettings />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
