// Xero Context Provider
// Comprehensive React context for managing Xero integration state and actions

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
  const [state, dispatch] = useReducer(xeroReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiClient, setApiClient] = useState<XeroApiClient | null>(null);

  // Merge with default config
  const fullConfig: XeroConfig = {
    clientId: '',
    redirectUri: '',
    scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings'],
    apiBaseUrl: '/api/xero',
    autoRefreshTokens: true,
    enableDemoMode: false,
    ...config,
  };

  // Load client ID from existing Xero settings
  const loadClientIdFromSettings = async () => {
    try {
      console.log('🔧 Loading client ID from existing Xero settings...');
      const existingSettings = await getXeroSettings();
      
      if (existingSettings?.clientId) {
        console.log('✅ Found existing Xero client ID:', existingSettings.clientId);
        
        const newConfig = {
          ...fullConfig,
          clientId: existingSettings.clientId,
        };
        
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
        return true;
      } else {
        console.log('ℹ️ No existing Xero client ID found');
        return false;
      }
    } catch (error) {
      console.log('ℹ️ No existing Xero settings found or error loading:', error);
      return false;
    }
  };

  // Initialize API client and load dynamic config
  useEffect(() => {
    const initializeProvider = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try to load client ID from existing settings
      const hasExistingSettings = await loadClientIdFromSettings();
      
      if (!hasExistingSettings) {
        // Create API client with provided config
        const client = createXeroApi(fullConfig);
        setApiClient(client);
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initializeProvider();
  }, [fullConfig]);

  // Rate limiting protection
  const canMakeApiCall = (): boolean => {
    const now = Date.now();
    if (now - lastApiCall < XERO_API_LIMITS.RETRY_DELAY_MS) {
      return false;
    }
    setLastApiCall(now);
    return true;
  };

  // Load settings
  const loadSettings = async () => {
    if (!apiClient || state.isLoading || !canMakeApiCall()) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const statusData = await apiClient.getConnectionStatus();
      
      const settingsData = {
        hasCredentials: statusData.hasCredentials || false,
        hasOAuthSettings: statusData.hasCredentials || false,
        isConnected: statusData.isConnected || false,
        connectionStatus: statusData.connectionStatus || 'unknown',
        tenants: statusData.tenants || []
      };
      
      dispatch({ type: 'SET_SETTINGS', payload: settingsData });

      const connectionStatus: XeroConnectionStatus = {
        isConnected: Boolean(statusData.isConnected),
        connectionStatus: statusData.connectionStatus || 'unknown',
        message: statusData.isConnected ? XERO_MESSAGES.CONNECT_SUCCESS : 'Not connected to Xero',
        tenants: statusData.tenants || [],
        hasValidTokens: statusData.hasValidTokens,
        needsReconnection: statusData.needsReconnection,
        lastConnected: statusData.lastConnected,
      };
      
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionStatus });
      
      // Auto-select first tenant if available and none selected
      if (connectionStatus.tenants && connectionStatus.tenants.length > 0 && !state.selectedTenant) {
        const firstTenant = connectionStatus.tenants[0];
        dispatch({ type: 'SET_SELECTED_TENANT', payload: firstTenant });
      }

      // Set demo mode if enabled
      if (fullConfig.enableDemoMode) {
        dispatch({ type: 'SET_DEMO_MODE', payload: true });
      }

    } catch (err: any) {
      console.error('❌ Failed to load settings:', err);
      
      if (err.response?.status !== 404 && err.response?.status !== 401) {
        const errorMessage = err.response?.data?.message || XERO_MESSAGES.SERVER_ERROR;
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
      } else {
        // Expected for users who haven't configured Xero yet
        const defaultSettings = {
          hasCredentials: false,
          hasOAuthSettings: false,
          isConnected: false,
          connectionStatus: 'not_configured',
          tenants: []
        };
        dispatch({ type: 'SET_SETTINGS', payload: defaultSettings });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized && apiClient) {
      loadSettings().catch(error => {
        console.error('❌ Failed to load settings on mount:', error);
      });
      setIsInitialized(true);
    }
  }, [isInitialized, apiClient]);

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

  // Start OAuth flow
  const startAuth = async () => {
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
      
      if (err.response?.status === 401) {
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
    if (!apiClient || !canMakeApiCall()) {
      return;
    }

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

      const result = await apiClient.handleCallback(code, state);
      
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
    if (!apiClient || !canMakeApiCall()) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      dispatch({ type: 'CLEAR_STATE' });
      
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TENANTS);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTHORIZED);
      localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
      
      await apiClient.deleteSettings();
      
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
