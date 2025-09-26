# 🔧 Client ID Fix for Xero Integration

The issue is that the new plug-and-play Xero integration is not properly using the client ID from your existing Xero settings. Here's how to fix it:

## 🚨 The Problem

Your existing system stores client IDs per company in the database, but the new plug-and-play integration expects a static configuration. This causes the integration to use an empty or incorrect client ID.

## ✅ The Solution

We need to modify the new integration to dynamically load the client ID from your existing Xero settings.

### Step 1: Update the XeroProvider Configuration

Modify your `XeroProvider` configuration to dynamically load client ID:

```tsx
// src/App.tsx - Update your XeroProvider configuration
import { XeroProvider } from './integrations/xero';
import { getXeroSettings } from './api/xeroService';

function App() {
  // Dynamic configuration that loads client ID from backend
  const getXeroConfig = async () => {
    try {
      const settings = await getXeroSettings();
      return {
        clientId: settings.clientId || '', // Load from existing settings
        redirectUri: window.location.origin + '/xero-callback',
        scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
        apiBaseUrl: '/api/xero',
        autoRefreshTokens: true,
        enableDemoMode: false,
      };
    } catch (error) {
      console.log('No Xero settings found, using default config');
      return {
        clientId: '', // Will be configured by user
        redirectUri: window.location.origin + '/xero-callback',
        scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
        apiBaseUrl: '/api/xero',
        autoRefreshTokens: true,
        enableDemoMode: false,
      };
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <XeroProvider 
            config={{
              clientId: '', // Will be loaded dynamically
              redirectUri: window.location.origin + '/xero-callback',
              scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
              apiBaseUrl: '/api/xero',
              autoRefreshTokens: true,
              enableDemoMode: false,
              // Add dynamic config loader
              dynamicConfig: true,
            }}
          >
            <Router>
              {/* Your existing routes */}
            </Router>
          </XeroProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Step 2: Update the XeroProvider to Support Dynamic Configuration

Create an enhanced version of the XeroProvider that loads client ID from your existing settings:

```tsx
// src/integrations/xero/context/DynamicXeroProvider.tsx
import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { getXeroSettings } from '../../api/xeroService';
import { 
  XeroState, 
  XeroAction, 
  XeroContextType, 
  XeroConfig, 
  XeroTokens, 
  XeroTenant, 
  XeroConnectionStatus,
  XeroDataRequest,
  XeroDataResponse,
  XeroSettings,
} from '../types';
import { createXeroApi, XeroApiClient } from '../api/xeroApi';
import { 
  XERO_LOCAL_STORAGE_KEYS, 
  XERO_API_LIMITS, 
  XERO_MESSAGES,
} from '../constants';

// Initial state
const initialState: XeroState = {
  tokens: null,
  tenants: [],
  selectedTenant: null,
  settings: null,
  connectionStatus: null,
  isLoading: false,
  error: null,
  isConnected: false,
  hasSettings: false,
  isDemoMode: false,
};

// Reducer (same as before)
function xeroReducer(state: XeroState, action: XeroAction): XeroState {
  // ... same reducer logic as before
}

// Context
const XeroContext = createContext<XeroContextType | undefined>(undefined);

interface DynamicXeroProviderProps {
  children: ReactNode;
  fallbackConfig: XeroConfig;
}

export const DynamicXeroProvider: React.FC<DynamicXeroProviderProps> = ({ 
  children, 
  fallbackConfig 
}) => {
  const [state, dispatch] = useReducer(xeroReducer, initialState);
  const [apiClient, setApiClient] = useState<XeroApiClient | null>(null);
  const [dynamicConfig, setDynamicConfig] = useState<XeroConfig>(fallbackConfig);

  // Load client ID from existing Xero settings
  useEffect(() => {
    const loadDynamicConfig = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const existingSettings = await getXeroSettings();
        
        if (existingSettings?.clientId) {
          console.log('✅ Found existing Xero client ID:', existingSettings.clientId);
          
          const newConfig = {
            ...fallbackConfig,
            clientId: existingSettings.clientId,
          };
          
          setDynamicConfig(newConfig);
          
          // Create API client with the loaded client ID
          const client = createXeroApi(newConfig);
          setApiClient(client);
          
          dispatch({ 
            type: 'SET_SETTINGS', 
            payload: existingSettings 
          });
          
          dispatch({ 
            type: 'SET_CONNECTION_STATUS', 
            payload: { 
              isConnected: existingSettings.isConnected || false,
              message: existingSettings.isConnected ? 'Connected to Xero' : 'Not connected',
              needsOAuth: !existingSettings.isConnected,
            }
          });
          
          toast.success('Xero client ID loaded from existing settings');
        } else {
          console.log('ℹ️ No existing Xero client ID found, using fallback config');
          setDynamicConfig(fallbackConfig);
          
          const client = createXeroApi(fallbackConfig);
          setApiClient(client);
        }
      } catch (error) {
        console.error('❌ Failed to load dynamic Xero config:', error);
        toast.error('Failed to load Xero configuration');
        
        // Use fallback config
        setDynamicConfig(fallbackConfig);
        const client = createXeroApi(fallbackConfig);
        setApiClient(client);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadDynamicConfig();
  }, []);

  // All the existing XeroProvider logic...
  // (loadSettings, startAuth, handleCallback, disconnect, etc.)

  const contextValue: XeroContextType = {
    ...state,
    config: dynamicConfig,
    loadSettings: async () => {
      // Implementation that uses the dynamic config
    },
    startAuth: async () => {
      // Implementation that uses the dynamic config
    },
    handleCallback: async (code: string, state: string) => {
      // Implementation that uses the dynamic config
    },
    disconnect: async () => {
      // Implementation that uses the dynamic config
    },
    refreshConnection: async () => {
      // Implementation that uses the dynamic config
    },
    loadData: async (request: XeroDataRequest) => {
      // Implementation that uses the dynamic config
    },
    selectTenant: (tenant: XeroTenant) => {
      dispatch({ type: 'SELECT_TENANT', payload: tenant });
    },
    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null });
    },
  };

  return (
    <XeroContext.Provider value={contextValue}>
      {children}
    </XeroContext.Provider>
  );
};

export const useXero = (): XeroContextType => {
  const context = useContext(XeroContext);
  if (context === undefined) {
    throw new Error('useXero must be used within a DynamicXeroProvider');
  }
  return context;
};
```

### Step 3: Update Your App.tsx to Use Dynamic Provider

```tsx
// src/App.tsx
import { DynamicXeroProvider } from './integrations/xero/context/DynamicXeroProvider';

function App() {
  const fallbackConfig = {
    clientId: '', // Will be loaded dynamically
    redirectUri: window.location.origin + '/xero-callback',
    scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
    apiBaseUrl: '/api/xero',
    autoRefreshTokens: true,
    enableDemoMode: false,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <DynamicXeroProvider fallbackConfig={fallbackConfig}>
            <Router>
              {/* Your existing routes */}
            </Router>
          </DynamicXeroProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Step 4: Alternative - Update Existing XeroProvider

If you prefer to update the existing XeroProvider, here's a simpler approach:

```tsx
// src/integrations/xero/context/XeroProvider.tsx
// Add this method to the existing XeroProvider class

// Add this to the XeroProvider class
const loadClientIdFromSettings = async () => {
  try {
    const settings = await getXeroSettings();
    if (settings?.clientId) {
      // Update the config with the loaded client ID
      const updatedConfig = {
        ...config,
        clientId: settings.clientId,
      };
      
      // Update the API client with new config
      const newApiClient = createXeroApi(updatedConfig);
      setApiClient(newApiClient);
      
      dispatch({ 
        type: 'SET_SETTINGS', 
        payload: settings 
      });
      
      console.log('✅ Client ID loaded from existing settings:', settings.clientId);
      return true;
    }
  } catch (error) {
    console.log('ℹ️ No existing Xero settings found');
  }
  return false;
};

// Call this in useEffect after component mount
useEffect(() => {
  const initializeProvider = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Try to load client ID from existing settings
    const hasExistingSettings = await loadClientIdFromSettings();
    
    if (!hasExistingSettings) {
      // Create API client with empty client ID (user will configure)
      const client = createXeroApi(config);
      setApiClient(client);
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  initializeProvider();
}, []);
```

### Step 5: Update XeroSettings Component

Make sure your XeroSettings component properly saves the client ID:

```tsx
// src/components/XeroSettings.tsx (update existing component)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.clientId.trim()) {
    toast.error('Please enter your Xero Client ID');
    return;
  }

  try {
    const settingsData = {
      clientId: formData.clientId.trim(),
      clientSecret: formData.clientSecret?.trim() || '',
      redirectUri: window.location.origin + '/xero-callback'
    };
    
    console.log('🔧 Saving Xero settings with client ID:', settingsData.clientId);
    
    await saveXeroSettings(settingsData);
    toast.success('Xero settings saved successfully!');
    
    // Reload the provider to pick up the new client ID
    if (onSettingsSaved) {
      onSettingsSaved();
    }
  } catch (error: any) {
    console.error('❌ Failed to save Xero settings:', error);
    toast.error(error.response?.data?.message || 'Failed to save Xero settings');
  }
};
```

## 🎯 Testing the Fix

1. **Clear any existing Xero settings** (optional, for testing)
2. **Start your application**
3. **Navigate to Xero Integration page**
4. **Configure Xero settings** with your actual client ID
5. **Save the settings**
6. **Try the OAuth flow** - it should now use the correct client ID

## 🔍 Debugging

Add these console logs to verify the client ID is being loaded correctly:

```tsx
// Add to your XeroProvider or DynamicXeroProvider
console.log('🔧 Xero Config:', config);
console.log('🔧 Client ID:', config.clientId);
console.log('🔧 Settings loaded:', state.settings);
```

## 📞 Expected Behavior After Fix

- ✅ **Client ID loads automatically** from existing Xero settings
- ✅ **OAuth flow uses correct client ID** from database
- ✅ **No manual configuration needed** for returning users
- ✅ **New users can still configure** their client ID
- ✅ **Backward compatibility** with existing Xero integrations

The fix ensures that your new plug-and-play Xero integration properly uses the client ID that's already stored in your database for each company, rather than trying to use an empty or static client ID.
