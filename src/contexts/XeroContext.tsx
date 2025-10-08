import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getXeroSettings, 
  getConnectionStatus, 
  getXeroAuthUrl, 
  handleXeroCallback,
  deleteXeroSettings 
} from '../api/xeroService';
import { getApiUrl } from '../utils/envChecker';

// Types
export interface XeroTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface XeroTenant {
  id: string;
  name: string;
  organizationName?: string;
  tenantName?: string;
  tenantId?: string;
}

export interface XeroSettings {
  id: number;
  companyId: number;
  accessToken?: string;
  clientId?: string;
  redirectUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface XeroConnectionStatus {
  isConnected: boolean | string;
  connectionStatus: string;
  message: string;
  tenants?: XeroTenant[];
  action?: string;
}

export type XeroResourceType = 
  | 'invoices' | 'contacts' | 'bank-transactions' | 'accounts' 
  | 'items' | 'tax-rates' | 'tracking-categories' | 'organization' | 'purchase-orders'
  | 'receipts' | 'credit-notes' | 'manual-journals' | 'prepayments'
  | 'overpayments' | 'quotes' | 'reports';

// State interface
interface XeroState {
  // Core state
  tokens: XeroTokens | null;
  tenants: XeroTenant[];
  selectedTenant: XeroTenant | null;
  settings: XeroSettings | null;
  connectionStatus: XeroConnectionStatus | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Computed
  isConnected: boolean;
  hasSettings: boolean;
}

// Action types
type XeroAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOKENS'; payload: XeroTokens | null }
  | { type: 'SET_TENANTS'; payload: XeroTenant[] }
  | { type: 'SET_SELECTED_TENANT'; payload: XeroTenant | null }
  | { type: 'SET_SETTINGS'; payload: XeroSettings | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: XeroConnectionStatus | null }
  | { type: 'CLEAR_STATE' }
  | { type: 'SET_CONNECTED'; payload: boolean };

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
interface XeroContextType {
  // State
  state: XeroState;
  
  // Actions
  startAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  disconnect: () => Promise<void>;
  loadSettings: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadData: (resourceType: XeroResourceType) => Promise<any>;
  selectTenant: (tenantId: string) => void;
  clearError: () => void;
}

const XeroContext = createContext<XeroContextType | undefined>(undefined);

// Provider component
interface XeroProviderProps {
  children: ReactNode;
}

export const XeroProvider: React.FC<XeroProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(xeroReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const API_RATE_LIMIT_MS = 2000; // 2 seconds between API calls

  const loadSettings = useCallback(async () => {
    console.log('🔄 loadSettings called, current state:', {
      isLoading: state.isLoading,
      lastApiCall,
      now: Date.now(),
      timeSinceLastCall: Date.now() - lastApiCall
    });
    console.log('🔧 API URL being used:', import.meta.env.VITE_API_URL || 'http://localhost:3333/api');
    console.log('🔧 Environment mode:', import.meta.env.MODE);
    console.log('🔧 Current window location:', window.location.origin);

    // Prevent multiple simultaneous calls
    if (state.isLoading) {
      console.log('⚠️ Settings already loading, skipping...');
      return;
    }

    // Rate limiting protection - but allow initial load
    const now = Date.now();
    if (lastApiCall > 0 && now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping API call');
      return;
    }

    try {
      setLastApiCall(now);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔄 Loading Xero settings...');
      
      // Use status endpoint to get both settings and connection info
      const statusData = await getConnectionStatus();
      console.log('✅ Status loaded:', statusData);
      
      // Create settings object from status data
      const settingsData = {
        id: 0, // Placeholder
        companyId: 0, // Placeholder
        hasCredentials: statusData.hasCredentials || false,
        hasOAuthSettings: statusData.hasCredentials || false,
        isConnected: statusData.isConnected || false,
        connectionStatus: statusData.connectionStatus || 'unknown',
        tenants: statusData.tenants || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      dispatch({ type: 'SET_SETTINGS', payload: settingsData });

      // Set tenants in the main state
      console.log('🔍 DEBUG: statusData received:', JSON.stringify(statusData, null, 2));
      console.log('🔍 DEBUG: statusData.tenants:', statusData.tenants);
      console.log('🔍 DEBUG: statusData.tenants length:', statusData.tenants?.length);
      
      if (statusData.tenants && statusData.tenants.length > 0) {
        console.log('🏢 Loading tenants from status:', statusData.tenants);
        console.log('🏢 Tenant structure:', statusData.tenants.map(t => ({
          id: t.id,
          name: t.name,
          organizationName: t.organizationName,
          tenantId: t.tenantId
        })));
        dispatch({ type: 'SET_TENANTS', payload: statusData.tenants });
        console.log('✅ Tenants dispatched to state');
      } else {
        console.log('⚠️ No tenants found in status data, trying tenants endpoint...');
        // Try the dedicated tenants endpoint as fallback
        try {
          const apiClient = (await import('../api/client')).default;
          console.log('🔍 DEBUG: Making request to /api/xero/tenants');
          const tenantsResponse = await apiClient.get('/api/xero/tenants');
          console.log('🔍 DEBUG: Tenants response:', JSON.stringify(tenantsResponse.data, null, 2));
          if (tenantsResponse.data.success && tenantsResponse.data.data) {
            const tenants = tenantsResponse.data.data.map((tenant: any) => ({
              id: tenant.tenantId,
              name: tenant.tenantName || tenant.organisationName || 'Unnamed Organization',
              organizationName: tenant.organisationName,
              tenantName: tenant.tenantName,
              tenantId: tenant.tenantId
            }));
            console.log('🏢 Loading tenants from tenants endpoint:', tenants);
            dispatch({ type: 'SET_TENANTS', payload: tenants });
            console.log('✅ Tenants dispatched to state from fallback');
          }
        } catch (tenantsError) {
          console.error('❌ Failed to load tenants from tenants endpoint:', tenantsError);
        }
      }

      // Set connection status
      const connectionStatus: XeroConnectionStatus = {
        isConnected: Boolean(statusData.isConnected),
        connectionStatus: statusData.connectionStatus || 'unknown',
        message: statusData.isConnected ? 'Xero connected successfully' : 'Not connected to Xero',
        tenants: statusData.tenants || []
      };
      
      console.log('🔧 Setting connection status:', connectionStatus);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionStatus });
      
      // Auto-select first tenant if available and none selected
      if (statusData.tenants && statusData.tenants.length > 0 && !state.selectedTenant) {
        const firstTenant = statusData.tenants[0];
        console.log('🎯 Auto-selecting first tenant:', firstTenant);
        dispatch({ type: 'SET_SELECTED_TENANT', payload: firstTenant });
      }
    } catch (err: any) {
      console.log('Settings load error:', err.response?.status, err.response?.data);
      
      // Only show errors for non-404 status codes (404 means no settings configured yet)
      if (err.response?.status !== 404) {
        const errorMessage = err.response?.data?.message || 'Failed to load Xero settings';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        // Only show toast for actual errors, not for missing settings
        if (err.response?.status !== 401) {
          toast.error(errorMessage);
        }
      } else {
        // 404 is expected for users who haven't configured Xero yet
        console.log('ℹ️ No Xero settings found - user needs to configure settings first');
        // Set default settings for OAuth to work
        const defaultSettings = {
          id: 0, // Placeholder
          companyId: 0, // Placeholder
          hasCredentials: false,
          hasOAuthSettings: false,
          isConnected: false,
          connectionStatus: 'not_configured',
          tenants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dispatch({ type: 'SET_SETTINGS', payload: defaultSettings });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isLoading, lastApiCall, state.selectedTenant]);

  // Load settings on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 XeroProvider: Initializing and loading settings...');
      loadSettings().catch(error => {
        console.error('❌ XeroProvider: Failed to load settings on mount:', error);
      });
      setIsInitialized(true);
    }
  }, [isInitialized, loadSettings]);

  // Persist connection status to localStorage
  useEffect(() => {
    if (state.isConnected) {
      localStorage.setItem('xero_authorized', 'true');
      localStorage.setItem('xero_auth_timestamp', Date.now().toString());
    } else {
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');
    }
  }, [state.isConnected]);



  const startAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🚀 Starting Xero authorization...');

      // Try to load settings first if not already loaded
      if (!state.hasSettings) {
        console.log('🔄 Settings not loaded, attempting to load first...');
        try {
          await loadSettings();
          // Check again after loading
          if (!state.hasSettings) {
            console.log('⚠️ Settings still not loaded, proceeding with OAuth anyway...');
            // Continue with OAuth even if settings are not configured
            // The backend should handle the OAuth flow
          }
        } catch (settingsError) {
          console.log('⚠️ Settings load failed, proceeding with OAuth anyway...');
          // Continue with OAuth even if settings load fails
        }
      }

      // Clear existing state
      dispatch({ type: 'CLEAR_STATE' });
      localStorage.removeItem('xero_tokens');
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');

      console.log('🔐 Getting Xero auth URL...');
      const { authUrl } = await getXeroAuthUrl();
      
      if (!authUrl || !authUrl.startsWith('https://login.xero.com/')) {
        throw new Error('Invalid authorization URL received from backend');
      }
      
      localStorage.setItem('xero_auth_start_time', Date.now().toString());
      console.log('🔄 Redirecting to Xero...');
      window.location.href = authUrl;
      
    } catch (err: any) {
      console.error('❌ Xero auth error:', err);
      let errorMessage = 'Failed to start Xero authorization';
      
      if (err.response?.status === 401) {
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
  }, [state.hasSettings, loadSettings]);

  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔄 Handling Xero callback...');
      
      const authStartTime = localStorage.getItem('xero_auth_start_time');
      if (authStartTime) {
        const authAge = Date.now() - parseInt(authStartTime);
        if (authAge > 4 * 60 * 1000) { // 4 minutes
          console.warn('⚠️ Authorization took longer than expected:', authAge / 1000, 'seconds');
          toast('Authorization took longer than expected. Please complete within 5 minutes.', { icon: '⚠️' });
        }
      }

      const result = await handleXeroCallback(code, state);
      
      console.log('✅ Callback successful:', result);
      
      // Set tokens and tenants
      dispatch({ type: 'SET_TOKENS', payload: result.tokens });
      dispatch({ type: 'SET_TENANTS', payload: result.tenants });
      
      if (result.tenants.length > 0) {
        dispatch({ type: 'SET_SELECTED_TENANT', payload: result.tenants[0] });
      }

      // Update connection status
      const connectionStatus: XeroConnectionStatus = {
        isConnected: true,
        connectionStatus: 'connected',
        message: 'Xero connected successfully',
        tenants: result.tenants
      };
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionStatus });

      // Store in localStorage
      localStorage.setItem('xero_tokens', JSON.stringify(result.tokens));
      localStorage.setItem('xero_authorized', 'true');
      localStorage.setItem('xero_auth_timestamp', Date.now().toString());

      toast.success('Successfully connected to Xero!');
      
      // Don't redirect - let the component handle the flow
      console.log('✅ Xero connection completed, staying on current page');
      
    } catch (err: any) {
      console.error('❌ Callback error:', err);
      
      let errorMessage = 'Failed to complete Xero authorization';
      
      if (err.response?.data?.code === 'EXPIRED_CODE') {
        errorMessage = 'Authorization code has expired. Please try again.';
      } else if (err.response?.data?.code === 'INVALID_CLIENT') {
        errorMessage = 'Invalid client configuration. Please check settings.';
      } else if (err.response?.data?.code === 'INVALID_REDIRECT_URI') {
        errorMessage = 'Invalid redirect URI. Please check configuration.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      
      // Clear any partial state
      dispatch({ type: 'CLEAR_STATE' });
      localStorage.removeItem('xero_tokens');
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔌 Disconnecting from Xero...');
      
      // Clear frontend state
      dispatch({ type: 'CLEAR_STATE' });
      
      // Clear localStorage
      localStorage.removeItem('xero_tokens');
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');
      
      // Call backend to clear tokens
      await deleteXeroSettings();
      
      toast.success('Successfully disconnected from Xero');
      console.log('✅ Disconnected from Xero');
    } catch (err: any) {
      console.error('❌ Disconnect error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to disconnect from Xero';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const refreshConnection = useCallback(async () => {
    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping refresh connection');
      toast('Please wait before making another request', { icon: '⚠️' });
      return;
    }
    
    try {
      console.log('🔄 Refreshing Xero connection...');
      await loadSettings();
      
      // Also refresh connection status to get latest tenants
      const status = await getConnectionStatus();
      console.log('🔄 Connection status refreshed:', status);
      
      // Update tenants if available
      if (status.tenants && status.tenants.length > 0) {
        console.log('🏢 Refreshing tenants:', status.tenants);
        dispatch({ type: 'SET_TENANTS', payload: status.tenants });
        
        // Auto-select first tenant if none selected
        if (!state.selectedTenant) {
          const firstTenant = status.tenants[0];
          console.log('🎯 Auto-selecting first tenant after refresh:', firstTenant);
          dispatch({ type: 'SET_SELECTED_TENANT', payload: firstTenant });
        }
      }
      
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
      
      console.log('✅ Connection refreshed successfully');
      toast.success('Connection refreshed successfully');
    } catch (error: any) {
      console.error('❌ Failed to refresh connection:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh connection' });
      toast.error('Failed to refresh connection');
    }
  }, [lastApiCall, loadSettings, state.selectedTenant]);

  const refreshToken = useCallback(async () => {
    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping token refresh');
      toast('Please wait before making another request', { icon: '⚠️' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔄 Attempting Xero token refresh...');
      
      // Use the proper refresh token function from xeroService
      const { refreshXeroToken } = await import('../api/xeroService');
      
      // Get company info from localStorage
      const companyData = localStorage.getItem('company');
      if (!companyData) {
        throw new Error('Company information not found');
      }
      
      const company = JSON.parse(companyData);
      
      // Get stored refresh token
      const storedTokens = localStorage.getItem('xero_tokens');
      if (!storedTokens) {
        throw new Error('No stored Xero tokens found');
      }
      
      const tokens = JSON.parse(storedTokens);
      if (!tokens.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Call the refresh token function
      const newTokens = await refreshXeroToken(tokens.refreshToken, company.id);
      
      console.log('✅ Token refresh successful:', newTokens);
      
      // Update tokens
      dispatch({ type: 'SET_TOKENS', payload: newTokens });
      localStorage.setItem('xero_tokens', JSON.stringify(newTokens));
      
      // Reload settings to get updated connection status
      await loadSettings();
      
      toast.success('Token refreshed successfully');
    } catch (err: any) {
      console.error('❌ Token refresh error:', err);
      
      // If refresh fails, clear the connection state and show reconnection message
      console.log('🔄 Token refresh failed - clearing connection state');
      dispatch({ type: 'CLEAR_STATE' });
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');
      localStorage.removeItem('xero_tokens');
      
      toast.error('Xero token has expired. Please reconnect to continue.', {
        duration: 10000
      });
      
      // Show a separate toast with action button
      setTimeout(() => {
        toast((t) => (
          <span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/xero';
              }}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Reconnect Now
            </button>
          </span>
        ), { duration: 8000 });
      }, 1000);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [lastApiCall, loadSettings]);

  const loadData = useCallback(async (resourceType: XeroResourceType) => {
    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping data load');
      toast('Please wait before making another request', { icon: '⚠️' });
      return;
    }

    try {
      setLastApiCall(now);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // More permissive - allow loading with demo data fallback
      if (!state.isConnected || !state.selectedTenant) {
        console.log('⚠️ Not fully connected, attempting to load demo data...');
        
        // Auto-select demo tenant if needed
        if (!state.selectedTenant) {
          const demoTenant = {
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            name: 'Demo Organization',
            organizationName: 'Demo Organization'
          };
          dispatch({ type: 'SET_SELECTED_TENANT', payload: demoTenant });
          console.log('🎭 Auto-selected demo tenant for data loading');
        }
      }

      console.log(`📊 Loading ${resourceType} data...`);
      
      try {
        // Try real Xero data first
        const { getXeroData } = await import('../api/xeroService');
        const data = await getXeroData(resourceType, state.selectedTenant?.id || '');
        
        console.log(`✅ ${resourceType} data loaded:`, data);
        return data;
      } catch (error: any) {
        console.log(`⚠️ Real Xero data failed, trying demo data for ${resourceType}:`, error.message);
        
        // Fallback to demo data
        try {
          const response = await fetch(`${getApiUrl()}/api/xero/demo/${resourceType}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const demoData = await response.json();
            console.log(`🎭 Demo ${resourceType} data loaded:`, demoData);
            return demoData;
          } else {
            throw new Error(`Demo data also failed: ${response.status}`);
          }
        } catch (demoError: any) {
          console.error(`❌ Both real and demo data failed for ${resourceType}:`, demoError);
          throw error; // Throw original error
        }
      }
    } catch (err: any) {
      console.error(`❌ Failed to load ${resourceType}:`, err);
      
      if (err.response?.status === 401 && err.response?.data?.action === 'reconnect_required') {
        console.log('❌ 401 Unauthorized - Tokens cleared by backend, clearing frontend state');
        dispatch({ type: 'CLEAR_STATE' });
        localStorage.removeItem('xero_authorized');
        localStorage.removeItem('xero_auth_timestamp');
        toast.error('Xero authorization expired. Please reconnect to continue.');
        throw new Error('Xero authorization expired. Please reconnect to continue.');
      }
      
      const errorMessage = err.response?.data?.message || err.message || `Failed to load ${resourceType}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [lastApiCall, state.isConnected, state.selectedTenant]);

  const selectTenant = useCallback((tenantId: string) => {
    const tenant = state.tenants.find(t => t.id === tenantId);
    if (tenant) {
      dispatch({ type: 'SET_SELECTED_TENANT', payload: tenant });
    }
  }, [state.tenants]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);



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
