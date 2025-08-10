import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { XeroProvider } from './contexts/XeroContext';
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
import AiChat from './pages/AiChat';
import AITools from './pages/AITools';
import XeroIntegration from './pages/XeroIntegration';
import XeroInvoices from './pages/XeroInvoices';
import XeroRedirect from './pages/XeroRedirect';
import XeroCallback from './pages/XeroCallback';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <AuthProvider>
            <XeroProvider>
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
                path="/ai-chat"
                element={
                  <ProtectedRoute>
                    <AiChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-tools"
                element={
                  <ProtectedRoute>
                    <AITools />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/integrations/xero"
                element={
                  <ProtectedRoute>
                    <XeroIntegration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/xero/:connectionId/invoices"
                element={
                  <ProtectedRoute>
                    <XeroInvoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/redirecturl"
                element={<XeroRedirect />}
              />
              <Route
                path="/xero-callback"
                element={<XeroCallback />}
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
            </XeroProvider>
          </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
