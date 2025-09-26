# 🚀 Quick Start - Xero Integration

Get your Xero integration up and running in 5 minutes!

## Step 1: Add XeroProvider to App.tsx

```tsx
// src/App.tsx
import { XeroProvider } from './integrations/xero';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          {/* ADD THIS LINE */}
          <XeroProvider config={{
            clientId: '',
            redirectUri: window.location.origin + '/xero-callback',
            scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
            apiBaseUrl: '/api/xero-plug-play',
            autoRefreshTokens: true,
            enableDemoMode: false,
          }}>
            <Router>
              {/* YOUR EXISTING ROUTES */}
              <Routes>
                {/* ADD THIS ROUTE */}
                <Route path="/xero" element={<XeroPage />} />
                <Route path="/xero-callback" element={<XeroCallback />} />
              </Routes>
            </Router>
          </XeroProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

## Step 2: Create XeroPage Component

```tsx
// src/pages/XeroPage.tsx
import React from 'react';
import { Container, Typography } from '@mui/material';
import { XeroConnect, XeroDashboard, XeroSettings, useXero } from '../integrations/xero';

const XeroPage: React.FC = () => {
  const { state } = useXero();
  const { isConnected } = state;

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="mb-6">
        Xero Integration
      </Typography>
      
      {!isConnected ? (
        <div className="space-y-6">
          <XeroSettings />
          <XeroConnect />
        </div>
      ) : (
        <XeroDashboard />
      )}
    </Container>
  );
};

export default XeroPage;
```

## Step 3: Create XeroCallback Component

```tsx
// src/pages/XeroCallback.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress } from '@mui/material';
import { useXero } from '../integrations/xero';

const XeroCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useXero();

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (code && state) {
        await handleCallback(code, state);
        navigate('/xero');
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <Container maxWidth="sm" className="py-8 text-center">
      <CircularProgress />
      <Typography className="mt-4">
        Processing Xero Authorization...
      </Typography>
    </Container>
  );
};

export default XeroCallback;
```

## Step 4: Add Navigation Link

```tsx
// Add to your navigation component
<Button component={Link} to="/xero">
  Xero Integration
</Button>
```

## Step 5: Test the Integration

1. **Start your servers** (backend and frontend)
2. **Navigate to** `/xero`
3. **Configure Xero settings** with your app credentials
4. **Click "Connect to Xero"**
5. **Complete OAuth flow**
6. **View your Xero data!**

## 🎉 You're Done!

Your Xero integration is now live and ready to use. The integration includes:

- ✅ **Secure OAuth 2.0 flow**
- ✅ **Automatic token management**
- ✅ **Real-time data access**
- ✅ **Beautiful UI components**
- ✅ **Error handling**
- ✅ **Demo mode for testing**

## 🔧 Next Steps

- **Customize the components** to match your design
- **Add more data tables** using `XeroDataTable`
- **Create custom widgets** using the `useXero` hook
- **Set up production credentials**

For advanced usage, see the full [Integration Guide](./INTEGRATION_GUIDE.md).
