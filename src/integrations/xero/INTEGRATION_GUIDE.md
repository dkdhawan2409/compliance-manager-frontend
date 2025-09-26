# Frontend Xero Integration - Complete Integration Guide

This guide shows you exactly how to integrate the plug-and-play Xero integration into your existing compliance management system frontend.

## 🔗 Quick Integration Steps

### 1. Update Your Existing App.tsx

Add the XeroProvider to wrap your existing app:

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// EXISTING IMPORTS
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './theme/theme';
import ProtectedRoute from './components/ProtectedRoute';
// ... your existing imports

// NEW XERO INTEGRATION
import { XeroProvider } from './integrations/xero';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 5 * 60 * 1000,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          {/* ADD XERO PROVIDER HERE */}
          <XeroProvider config={{
            clientId: '', // Will be configured by user
            redirectUri: window.location.origin + '/xero-callback',
            scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
            apiBaseUrl: '/api/xero-plug-play',
            autoRefreshTokens: true,
            enableDemoMode: false,
          }}>
            <Router>
              {/* YOUR EXISTING ROUTES */}
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* ... existing routes ... */}
                
                {/* ADD NEW XERO ROUTES */}
                <Route
                  path="/xero-integration"
                  element={
                    <ProtectedRoute>
                      <XeroIntegrationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/xero-callback"
                  element={<XeroCallbackHandler />}
                />
                <Route
                  path="/xero-dashboard"
                  element={
                    <ProtectedRoute>
                      <XeroDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </XeroProvider>
        </AuthProvider>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 2. Create New Xero Pages

Create these new pages in your `src/pages/` directory:

#### A. Main Xero Integration Page

```tsx
// src/pages/XeroIntegrationPage.tsx
import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Grid,
  Alert,
  Button
} from '@mui/material';
import { 
  XeroConnect, 
  XeroDashboard, 
  XeroSettings, 
  XeroStatusBadge,
  useXero 
} from '../integrations/xero';
import { useNavigate } from 'react-router-dom';

const XeroIntegrationPage: React.FC = () => {
  const { state } = useXero();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'settings' | 'dashboard' | 'data'>('settings');

  const { isConnected, hasSettings } = state;

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="mb-6">
        Xero Integration
      </Typography>

      {/* Connection Status */}
      <Box className="mb-6">
        <XeroStatusBadge showMessage />
      </Box>

      {/* Navigation Tabs */}
      <Box className="mb-6">
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant={activeTab === 'settings' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('dashboard')}
              disabled={!isConnected}
            >
              Dashboard
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={activeTab === 'data' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('data')}
              disabled={!isConnected}
            >
              Data Tables
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Xero Configuration
            </Typography>
            
            {!hasSettings && (
              <Alert severity="info" className="mb-4">
                Configure your Xero app credentials to get started with the integration.
              </Alert>
            )}
            
            <XeroSettings 
              onSettingsChange={(settings) => {
                console.log('Settings updated:', settings);
              }}
              onSave={(settings) => {
                console.log('Settings saved:', settings);
              }}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'dashboard' && isConnected && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Xero Dashboard
            </Typography>
            <XeroDashboard 
              showSummary
              showRecentData
              onDataLoad={(data) => {
                console.log('Dashboard data loaded:', data);
              }}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'data' && isConnected && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Xero Data Tables
            </Typography>
            <Alert severity="info" className="mb-4">
              Use the data tables below to view and manage your Xero data.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" className="mb-2">
                  Recent Invoices
                </Typography>
                <XeroDataTable 
                  resourceType="invoices"
                  pageSize={10}
                  showPagination={false}
                  onRowClick={(invoice) => {
                    console.log('Invoice clicked:', invoice);
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" className="mb-2">
                  Recent Contacts
                </Typography>
                <XeroDataTable 
                  resourceType="contacts"
                  pageSize={10}
                  showPagination={false}
                  onRowClick={(contact) => {
                    console.log('Contact clicked:', contact);
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {!isConnected && activeTab !== 'settings' && (
        <Card>
          <CardContent className="text-center py-8">
            <Alert severity="warning">
              Please configure and connect your Xero account first.
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => setActiveTab('settings')}
              className="mt-4"
            >
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default XeroIntegrationPage;
```

#### B. Xero Callback Handler

```tsx
// src/pages/XeroCallbackHandler.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useXero } from '../integrations/xero';
import { toast } from 'react-hot-toast';

const XeroCallbackHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useXero();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          toast.error(`Xero authorization failed: ${error}`);
          navigate('/xero-integration');
          return;
        }

        if (!code || !state) {
          toast.error('Invalid callback parameters');
          navigate('/xero-integration');
          return;
        }

        // Handle the OAuth callback
        await handleCallback(code, state);
        
        toast.success('Successfully connected to Xero!');
        navigate('/xero-integration');
      } catch (error: any) {
        console.error('Callback error:', error);
        toast.error(error.message || 'Failed to complete Xero authorization');
        navigate('/xero-integration');
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <Container maxWidth="sm" className="py-8">
      <Box className="text-center">
        <CircularProgress className="mb-4" />
        <Typography variant="h6">
          Processing Xero Authorization...
        </Typography>
        <Alert severity="info" className="mt-4">
          Please wait while we complete your Xero connection.
        </Alert>
      </Box>
    </Container>
  );
};

export default XeroCallbackHandler;
```

### 3. Update Your Sidebar Navigation

Add the new plug-and-play Xero integration to your existing sidebar menu:

```tsx
// src/components/SidebarLayout.tsx
// Add this to your userNavLinks array (around line 20-41)

const userNavLinks = [
  { name: 'Dashboard', to: '/dashboard', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
  ) },
  { name: 'Profile', to: '/profile', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { name: 'Compliance', to: '/compliance', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg>
  ) },
  
  // NEW PLUG-AND-PLAY XERO INTEGRATION
  { name: '🚀 Xero Integration', to: '/xero-integration', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ), companyOnly: true },
  
  // Keep your existing Xero links for backward compatibility
  { name: '🚀 Xero Flow', to: '/xero', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ), companyOnly: true },
  { name: 'Xero Integration', to: '/integrations/xero', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ), companyOnly: true },
  
  // ... rest of your existing links
];
```

### 4. Add Xero Status Badge to Header

Add the Xero status badge to your header for quick connection status:

```tsx
// src/components/SidebarLayout.tsx
// Add this import at the top
import { XeroStatusBadgeCompact } from '../integrations/xero';

// In your header section (around line 194-235), add the status badge:
<header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-14 px-4 md:px-6">
  <button
    className="md:hidden mr-4"
    onClick={() => setSidebarOpen((v) => !v)}
    aria-label="Open sidebar"
  >
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
  </button>
  <span className="text-lg font-semibold text-indigo-700 flex-1">Compliance Management</span>
  
  {/* ADD XERO STATUS BADGE HERE */}
  <div className="mr-4">
    <XeroStatusBadgeCompact 
      onClick={() => navigate('/xero-integration')}
      className="cursor-pointer"
    />
  </div>
  
  <div className="relative" ref={avatarRef}>
    {/* ... existing avatar dropdown code ... */}
  </div>
</header>
```

### 4. Update Your API Client

Update your existing API client to work with the new Xero routes:

```tsx
// src/api/client.ts (update your existing file)
import axios from 'axios';

// ... your existing code ...

// Add Xero-specific interceptors
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log Xero-related requests for debugging
    if (config.url?.includes('/xero/')) {
      console.log('🔐 Xero API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ... rest of your existing code ...
```

### 5. Create a Xero Widget for Dashboard

Add Xero data to your existing dashboard:

```tsx
// src/components/XeroWidget.tsx
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Button,
  Alert
} from '@mui/material';
import { useXero } from '../integrations/xero';
import { useNavigate } from 'react-router-dom';

interface XeroWidgetProps {
  className?: string;
}

const XeroWidget: React.FC<XeroWidgetProps> = ({ className }) => {
  const { state, loadData } = useXero();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { isConnected, selectedTenant } = state;

  useEffect(() => {
    if (isConnected && selectedTenant) {
      loadSummary();
    }
  }, [isConnected, selectedTenant]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await loadData({
        resourceType: 'financial-summary',
        tenantId: selectedTenant?.id
      });
      
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load Xero summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Xero Integration
          </Typography>
          <Alert severity="info" className="mb-3">
            Connect your Xero account to view financial data
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/xero-integration')}
            fullWidth
          >
            Connect Xero
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent>
        <Box className="flex justify-between items-center mb-3">
          <Typography variant="h6">
            Xero Overview
          </Typography>
          <Chip 
            label="Connected" 
            color="success" 
            size="small" 
          />
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : summary ? (
          <Box>
            <Box className="grid grid-cols-2 gap-4 mb-3">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h6" color="green">
                  ${summary.totalRevenue}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Outstanding
                </Typography>
                <Typography variant="h6" color="orange">
                  ${summary.outstandingRevenue}
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="outlined" 
              onClick={() => navigate('/xero-dashboard')}
              fullWidth
              size="small"
            >
              View Full Dashboard
            </Button>
          </Box>
        ) : (
          <Typography color="text.secondary">
            No data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default XeroWidget;
```

### 6. Update Your Existing Dashboard

Add the Xero widget to your existing dashboard:

```tsx
// src/pages/Dashboard.tsx (update your existing dashboard)
import React from 'react';
import { Container, Grid, Typography } from '@mui/material';

// EXISTING IMPORTS
import SomeExistingComponent from '../components/SomeExistingComponent';

// NEW XERO WIDGET
import XeroWidget from '../components/XeroWidget';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="mb-6">
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* EXISTING DASHBOARD ITEMS */}
        <Grid item xs={12} md={6}>
          <SomeExistingComponent />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <SomeOtherComponent />
        </Grid>

        {/* NEW XERO WIDGET */}
        <Grid item xs={12} md={6}>
          <XeroWidget />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
```

### 7. Environment Configuration

Update your environment configuration:

```env
# .env (add these to your existing .env file)
VITE_API_URL=http://localhost:3333/api
VITE_XERO_REDIRECT_URI=http://localhost:3000/xero-callback
```

### 8. Update Package.json Scripts (if needed)

Your existing package.json should already have the necessary dependencies. If not, add:

```json
{
  "dependencies": {
    // ... your existing dependencies ...
    "@mui/material": "^7.2.0",
    "@mui/icons-material": "^7.2.0",
    "react-hot-toast": "^2.5.2",
    "axios": "^1.11.0"
  }
}
```

## 🎯 Integration Checklist

- [ ] ✅ Added XeroProvider to App.tsx
- [ ] ✅ Created XeroIntegrationPage
- [ ] ✅ Created XeroCallbackHandler
- [ ] ✅ Updated navigation with Xero links
- [ ] ✅ Added XeroStatusBadge to navbar
- [ ] ✅ Created XeroWidget for dashboard
- [ ] ✅ Updated existing dashboard
- [ ] ✅ Set environment variables
- [ ] ✅ Updated API client (if needed)

## 🚀 Testing the Integration

1. **Start your backend server** (make sure the new Xero routes are registered)
2. **Start your frontend server**: `npm run dev`
3. **Navigate to** `/xero-integration`
4. **Configure Xero settings** with your app credentials
5. **Test the OAuth flow** by clicking "Connect to Xero"
6. **Verify data loading** in the dashboard and data tables

## 🔧 Customization Options

### Custom Styling
```tsx
// Customize component appearance
<XeroConnect className="my-custom-xero-connect" />
<XeroDashboard className="my-custom-xero-dashboard" />
```

### Custom Configuration
```tsx
// Customize scopes and behavior
<XeroProvider config={{
  clientId: 'your-client-id',
  redirectUri: 'https://yourdomain.com/callback',
  scopes: ['offline_access', 'accounting.transactions.read'], // Read-only
  apiBaseUrl: '/api/xero',
  autoRefreshTokens: true,
  enableDemoMode: process.env.NODE_ENV === 'development'
}}>
```

### Custom Data Processing
```tsx
// Process data before displaying
const { loadData } = useXero();

const customInvoices = await loadData({
  resourceType: 'invoices',
  tenantId: selectedTenant.id,
  page: 1,
  pageSize: 50
});

// Custom processing
const processedInvoices = customInvoices.data.map(invoice => ({
  ...invoice,
  customField: calculateCustomValue(invoice)
}));
```

## 📞 Support

If you encounter any issues during integration:

1. Check browser console for errors
2. Verify backend routes are registered
3. Check environment variables are set
4. Test API endpoints individually
5. Review the integration test results

Your Xero integration is now fully integrated into your existing compliance management system! 🎉
