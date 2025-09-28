// Xero Context Provider
// Comprehensive React context for managing Xero integration state and actions

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
// Removed dependency on old xeroService - using new API client instead
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

// Reducer
function xeroReducer(state: XeroState, action: XeroAction): XeroState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    
    case 'SET_TENANTS':
      return { ...state, tenants: action.payload };
    
    case 'SET_SELECTED_TENANT':
      return { ...state, selectedTenant: action.payload };
    
    case 'SET_SETTINGS':
      return { 
        ...state, 
        settings: action.payload,
        hasSettings: !!action.payload 
      };
    
    case 'SET_CONNECTION_STATUS':
      const connectionStatus = action.payload;
      const isConnected = connectionStatus?.isConnected === true || connectionStatus?.isConnected === 'true';
      return { 
        ...state, 
        connectionStatus: action.payload,
        isConnected,
        tenants: action.payload?.tenants || state.tenants
      };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_DEMO_MODE':
      return { ...state, isDemoMode: action.payload };
    
    case 'CLEAR_STATE':
      return {
        ...initialState,
        isLoading: state.isLoading
      };
    
    default:
      return state;
  }
}

// Context
const XeroContext = createContext<XeroContextType | undefined>(undefined);

// Provider Props
interface XeroProviderProps {
  children: ReactNode;
  config?: Partial<XeroConfig>;
}

// Provider Component
export const XeroProvider: React.FC<XeroProviderProps> = ({ children, config = {} }) => {
  // 🚨 GLOBAL EMERGENCY BRAKE - COMPLETELY DISABLE ALL XERO OPERATIONS
  const EMERGENCY_BRAKE_ACTIVE = false;
  
  if (EMERGENCY_BRAKE_ACTIVE) {
    console.log('🚨🚨🚨 GLOBAL EMERGENCY BRAKE ACTIVE - ALL XERO OPERATIONS DISABLED 🚨🚨🚨');
    // Return a completely disabled provider with safe no-op functions
    return (
      <XeroContext.Provider value={{
        state: {
          ...initialState,
          hasSettings: true, // Enable button to be clickable
          connectionStatus: 'disconnected', // Show as disconnected
        },
        startAuth: () => { 
          console.log('🚫 Emergency brake: startAuth disabled');
          // Show user-friendly message
          if (typeof window !== 'undefined' && window.alert) {
            alert('🚨 Xero operations are currently disabled due to system maintenance. Please try again later.');
          }
          return Promise.resolve();
        },
        handleCallback: () => { 
          console.log('🚫 Emergency brake: handleCallback disabled');
          return Promise.resolve();
        },
        disconnect: () => { 
          console.log('🚫 Emergency brake: disconnect disabled');
          return Promise.resolve();
        },
        loadSettings: () => { 
          console.log('🚫 Emergency brake: loadSettings disabled');
          return Promise.resolve();
        },
        refreshConnection: () => { 
          console.log('🚫 Emergency brake: refreshConnection disabled');
          return Promise.resolve();
        },
        refreshToken: () => { 
          console.log('🚫 Emergency brake: refreshToken disabled');
          return Promise.resolve();
        },
        loadData: () => { 
          console.log('🚫 Emergency brake: loadData disabled');
          return Promise.resolve({ success: false, message: 'Emergency brake active' });
        },
        selectTenant: () => { 
          console.log('🚫 Emergency brake: selectTenant disabled');
        },
        clearError: () => { 
          console.log('🚫 Emergency brake: clearError disabled');
        },
        saveSettings: () => { 
          console.log('🚫 Emergency brake: saveSettings disabled');
          return Promise.resolve();
        },
        deleteSettings: () => { 
          console.log('🚫 Emergency brake: deleteSettings disabled');
          return Promise.resolve();
        },
      }}>
        {children}
      </XeroContext.Provider>
    );
  }

  const [state, dispatch] = useReducer(xeroReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiClient, setApiClient] = useState<XeroApiClient | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [maxApiCalls] = useState(5); // Maximum API calls allowed

  // Merge with default config - MEMOIZED TO PREVENT INFINITE RENDERS
  const fullConfig: XeroConfig = useMemo(() => {
    // Determine API base URL based on environment
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    const apiBaseUrl = isProduction 
      ? 'https://compliance-manager-backend.onrender.com/api/xero-plug-play' // Production backend
      : '/api/xero-plug-play'; // Local development
    
    console.log('🔧 XeroProvider Config:', { isProduction, apiBaseUrl, hostname: window.location.hostname });
    
    // Determine redirect URI based on environment
    const redirectUri = isProduction 
      ? `${window.location.origin}/xero-callback` // Production callback
      : `${window.location.origin}/xero-callback`; // Local callback
    
    return {
      clientId: '',
      redirectUri,
      scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings'],
      apiBaseUrl,
      autoRefreshTokens: true,
      enableDemoMode: false,
      ...config,
    };
  }, [config]);

  // Load client ID from existing Xero settings - RE-ENABLED FOR PRODUCTION
  const loadClientIdFromSettings = useCallback(async () => {
    if (!canMakeApiCall()) {
      console.log('⏳ Rate limit: Too soon since last API call, skipping loadClientIdFromSettings...');
      return false;
    }
    
    console.log('🔧 Loading client ID from existing Xero settings...');
    try {
      const tempClient = createXeroApi(fullConfig);
      const settings = await tempClient.getSettings();
      
      if (settings.clientId) {
        console.log('✅ Found existing client ID:', settings.clientId.substring(0, 8) + '...');
        return true;
      } else {
        console.log('⚠️ No client ID found in settings');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to load client ID from settings:', error);
      return false;
    }
  }, [fullConfig, canMakeApiCall]);

  // Initialize API client and load dynamic config - RE-ENABLED FOR PRODUCTION
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 Initializing XeroProvider - loading settings...');
      setIsInitialized(true);
      
      // Load settings to check if credentials are configured
      setTimeout(() => {
        loadSettings();
      }, 1000); // Small delay to prevent immediate API call
    }
  }, [isInitialized, loadSettings]); // Include dependencies

  // Rate limiting protection
  const canMakeApiCall = (): boolean => {
    const now = Date.now();
    if (now - lastApiCall < XERO_API_LIMITS.RETRY_DELAY_MS) {
      return false;
    }
    setLastApiCall(now);
    return true;
  };

  // Load settings - RE-ENABLED TO CHECK CREDENTIALS
  const loadSettings = useCallback(async () => {
    if (isLoadingSettings) {
      console.log('⏳ Settings already loading, skipping...');
      return;
    }
    
    const now = Date.now();
    if (now - lastApiCall < 2000) { // 2 second cooldown
      console.log('⏳ Too soon since last API call, skipping loadSettings...');
      return;
    }
    
    setIsLoadingSettings(true);
    setLastApiCall(now);
    
    try {
      console.log('🔧 Loading Xero settings to check credentials...');
      const tempClient = createXeroApi(fullConfig);
      const settings = await tempClient.getSettings();
      
      console.log('✅ Settings loaded:', settings);
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      
      // Update connection status based on settings
      if (settings.isConnected) {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: {
          isConnected: true,
          connectionStatus: 'connected',
          message: 'Connected to Xero',
          tenants: settings.tenants || [],
          hasCredentials: true,
        }});
      } else {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: {
          isConnected: false,
          connectionStatus: 'disconnected',
          message: 'Not connected to Xero',
          tenants: [],
          hasCredentials: !!settings.clientId,
        }});
      }
      
    } catch (err: any) {
      console.error('❌ Failed to load settings:', err);
      // Don't show error toast for settings load failure
      // Just set hasSettings to false
      dispatch({ type: 'SET_SETTINGS', payload: null });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [fullConfig, isLoadingSettings, lastApiCall]);

  // Initialize on mount - RE-ENABLED TO LOAD SETTINGS
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 Initializing XeroProvider - loading settings...');
      setIsInitialized(true);
      
      // Load settings to check if credentials are configured
      setTimeout(() => {
        loadSettings();
      }, 1000); // Small delay to prevent immediate API call
    }
  }, [isInitialized, loadSettings]);

  // Persist connection status
  useEffect(() => {
    if (state.isConnected) {
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED, 'true');
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());
    } else {
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
    }
  }, [state.isConnected]);

  // Start OAuth flow - RE-ENABLED BUT MODIFIED TO WORK
  const startAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Clear existing state
      dispatch({ type: 'CLEAR_STATE' });
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);

      // Create a temporary API client for auth URL
      const tempClient = createXeroApi(fullConfig);
      const authResponse = await tempClient.getAuthUrl();
      console.log('🔧 Auth response:', authResponse);
      
      if (!authResponse || !authResponse.authUrl) {
        throw new Error('Invalid authorization response received from backend');
      }
      
      const { authUrl } = authResponse;
      window.location.href = authUrl;
      
    } catch (err: any) {
      console.error('❌ Error connecting to Xero:', err);
      
      let errorMessage = 'Failed to connect to Xero';
      
      // Handle specific client ID validation errors
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData?.error === 'CLIENT_ID_NOT_SET') {
          errorMessage = 'Xero Client ID is not configured. Please ask your administrator to configure Xero client credentials.';
        } else if (errorData?.error === 'CLIENT_SECRET_NOT_SET') {
          errorMessage = 'Xero Client Secret is not configured. Please ask your administrator to configure Xero client credentials.';
        } else if (errorData?.error === 'NO_XERO_SETTINGS') {
          errorMessage = 'Xero settings not found. Please ask your administrator to configure Xero client credentials for your company.';
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Xero OAuth endpoint not found. Please check backend implementation.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Backend server error. Please check server logs.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // DISABLED - Original startAuth function
  const startAuth_ORIGINAL = async () => {
    if (!apiClient || !canMakeApiCall()) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Clear existing state
      dispatch({ type: 'CLEAR_STATE' });
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);

      const authResponse = await apiClient.getAuthUrl();
      console.log('🔧 Auth response:', authResponse);
      
      if (!authResponse || !authResponse.authUrl) {
        throw new Error('Invalid authorization response received from backend');
      }
      
      const { authUrl } = authResponse;
      
      if (!authUrl || !authUrl.startsWith('https://login.xero.com/')) {
        throw new Error('Invalid authorization URL received from backend');
      }
      
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.AUTH_START_TIME, Date.now().toString());
      window.location.href = authUrl;
      
    } catch (err: any) {
      console.error('❌ Xero auth error:', err);
      let errorMessage = XERO_MESSAGES.CONNECT_ERROR;
      
      // Handle specific client ID validation errors
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData?.error === 'CLIENT_ID_NOT_SET') {
          errorMessage = 'Xero Client ID is not configured. Please ask your administrator to configure Xero client credentials.';
        } else if (errorData?.error === 'CLIENT_SECRET_NOT_SET') {
          errorMessage = 'Xero Client Secret is not configured. Please ask your administrator to configure Xero client credentials.';
        } else if (errorData?.error === 'NO_XERO_SETTINGS') {
          errorMessage = 'Xero settings not found. Please ask your administrator to configure Xero client credentials for your company.';
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } else if (err.response?.status === 401) {
        errorMessage = XERO_MESSAGES.UNAUTHORIZED;
      } else if (err.response?.status === 404) {
        errorMessage = 'Xero OAuth endpoint not found. Please check backend implementation.';
      } else if (err.response?.status === 500) {
        errorMessage = XERO_MESSAGES.SERVER_ERROR;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Handle OAuth callback
  const handleCallback = async (code: string, state: string) => {
    // Create a temporary API client for callback handling
    const tempClient = createXeroApi(fullConfig);

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const authStartTime = localStorage.getItem(XERO_LOCAL_STORAGE_KEYS.AUTH_START_TIME);
      if (authStartTime) {
        const authAge = Date.now() - parseInt(authStartTime);
        if (authAge > 4 * 60 * 1000) { // 4 minutes
          console.warn('⚠️ Authorization took longer than expected:', authAge / 1000, 'seconds');
          toast('Authorization took longer than expected. Please complete within 5 minutes.', { icon: '⚠️' });
        }
      }

      const result = await tempClient.handleCallback(code, state);
      
      dispatch({ type: 'SET_TOKENS', payload: result.tokens });
      dispatch({ type: 'SET_TENANTS', payload: result.tenants });
      
      if (result.tenants.length > 0) {
        dispatch({ type: 'SET_SELECTED_TENANT', payload: result.tenants[0] });
      }

      const connectionStatus: XeroConnectionStatus = {
        isConnected: true,
        connectionStatus: 'connected',
        message: XERO_MESSAGES.CONNECT_SUCCESS,
        tenants: result.tenants,
        hasValidTokens: true,
        lastConnected: new Date().toISOString(),
      };
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionStatus });

      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.TENANTS, JSON.stringify(result.tenants));
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED, 'true');
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());

      toast.success(XERO_MESSAGES.CONNECT_SUCCESS);
      
    } catch (err: any) {
      console.error('❌ Callback error:', err);
      
      let errorMessage = 'Failed to complete Xero authorization';
      
      if (err.response?.data?.code === XERO_ERROR_CODES.EXPIRED_TOKEN) {
        errorMessage = 'Authorization code has expired. Please try again.';
      } else if (err.response?.data?.code === XERO_ERROR_CODES.INVALID_CLIENT) {
        errorMessage = 'Invalid client configuration. Please check settings.';
      } else if (err.response?.data?.code === XERO_ERROR_CODES.INVALID_REQUEST) {
        errorMessage = 'Invalid redirect URI. Please check configuration.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      
      dispatch({ type: 'CLEAR_STATE' });
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Disconnect
  const disconnect = async () => {
    // Create a temporary API client for disconnect
    const tempClient = createXeroApi(fullConfig);

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      dispatch({ type: 'CLEAR_STATE' });
      
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TENANTS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
      
      await tempClient.deleteSettings();
      
      toast.success(XERO_MESSAGES.DISCONNECT_SUCCESS);
    } catch (err: any) {
      console.error('❌ Disconnect error:', err);
      const errorMessage = err.response?.data?.message || XERO_MESSAGES.DISCONNECT_ERROR;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Refresh connection
  const refreshConnection = async () => {
    if (!canMakeApiCall()) {
      toast('Please wait before making another request', { icon: '⚠️' });
      return;
    }
    
    try {
      await loadSettings();
      toast.success('Connection refreshed successfully');
    } catch (error: any) {
      console.error('❌ Failed to refresh connection:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh connection' });
    }
  };

  // Refresh token
  const refreshToken = async () => {
    if (!apiClient || !canMakeApiCall()) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await apiClient.refreshAccessToken();
      toast.success(XERO_MESSAGES.TOKEN_REFRESH_SUCCESS);
    } catch (err: any) {
      console.error('❌ Token refresh error:', err);
      const errorMessage = err.response?.data?.message || XERO_MESSAGES.TOKEN_REFRESH_ERROR;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load data
  const loadData = async <T = any>(request: XeroDataRequest): Promise<XeroDataResponse<T>> => {
    if (!apiClient || !canMakeApiCall()) {
      throw new Error('API client not available or rate limited');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Auto-select tenant if needed
      if (!request.tenantId && state.selectedTenant) {
        request.tenantId = state.selectedTenant.id;
      }

      // Try demo mode if enabled and not connected
      if (fullConfig.enableDemoMode && !state.isConnected) {
        try {
          const data = await apiClient.getDemoData(request.resourceType);
          return data;
        } catch (demoError) {
          console.log('Demo data failed, trying real data...');
        }
      }

      const data = await apiClient.loadData<T>(request);
      return data;
    } catch (err: any) {
      console.error(`❌ Failed to load ${request.resourceType}:`, err);
      
      if (err.response?.status === 401 && err.response?.data?.action === 'reconnect_required') {
        dispatch({ type: 'CLEAR_STATE' });
        localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
        localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
        toast.error('Xero authorization expired. Please reconnect to continue.');
        throw new Error('Xero authorization expired. Please reconnect to continue.');
      }
      
      const errorMessage = err.response?.data?.message || err.message || `Failed to load ${request.resourceType}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Select tenant
  const selectTenant = (tenantId: string) => {
    const tenant = state.tenants.find(t => t.id === tenantId);
    if (tenant) {
      dispatch({ type: 'SET_SELECTED_TENANT', payload: tenant });
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.SELECTED_TENANT, JSON.stringify(tenant));
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Save settings
  const saveSettings = async (settings: Partial<XeroSettings>) => {
    if (!apiClient || !canMakeApiCall()) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const savedSettings = await apiClient.saveSettings(settings);
      dispatch({ type: 'SET_SETTINGS', payload: savedSettings });
      toast.success(XERO_MESSAGES.SETTINGS_SAVE_SUCCESS);
    } catch (err: any) {
      console.error('❌ Failed to save settings:', err);
      const errorMessage = err.response?.data?.message || XERO_MESSAGES.SETTINGS_SAVE_ERROR;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Delete settings
  const deleteSettings = async () => {
    if (!apiClient || !canMakeApiCall()) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await apiClient.deleteSettings();
      dispatch({ type: 'SET_SETTINGS', payload: null });
      toast.success(XERO_MESSAGES.SETTINGS_DELETE_SUCCESS);
    } catch (err: any) {
      console.error('❌ Failed to delete settings:', err);
      const errorMessage = err.response?.data?.message || XERO_MESSAGES.SETTINGS_DELETE_ERROR;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: XeroContextType = {
    state,
    startAuth,
    handleCallback,
    disconnect,
    loadSettings,
    refreshConnection,
    refreshToken,
    loadData,
    selectTenant,
    clearError,
    saveSettings,
    deleteSettings,
  };

  return (
    <XeroContext.Provider value={value}>
      {children}
    </XeroContext.Provider>
  );
};

// Hook to use the context
export const useXero = (): XeroContextType => {
  const context = useContext(XeroContext);
  if (context === undefined) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  return context;
};
