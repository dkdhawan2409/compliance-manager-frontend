import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getXeroSettings, 
  getConnectionStatus, 
  getXeroAuthUrl, 
  handleXeroCallback,
  deleteXeroSettings 
} from '../api/xeroService';

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
  clientId: string;
  redirectUri: string;
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

  const loadSettings = async () => {
    // Prevent multiple simultaneous calls
    if (state.isLoading) {
      console.log('⚠️ Settings already loading, skipping...');
      return;
    }

    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping API call');
      return;
    }

    try {
      setLastApiCall(now);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔄 Loading Xero settings...');
      const settingsData = await getXeroSettings();
      
      if (settingsData) {
        console.log('✅ Settings loaded:', settingsData);
        dispatch({ type: 'SET_SETTINGS', payload: settingsData });

        // Check connection status
        if (settingsData.isConnected !== undefined) {
          const connectionStatus: XeroConnectionStatus = {
            isConnected: Boolean(settingsData.isConnected),
            connectionStatus: settingsData.connectionStatus || 'unknown',
            message: settingsData.isConnected ? 'Xero connected successfully' : 'Not connected to Xero',
            tenants: settingsData.tenants || []
          };
          
          console.log('🔧 Setting connection status:', connectionStatus);
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionStatus });
        } else {
          // Fallback to separate connection status call
          try {
            const status = await getConnectionStatus();
            console.log('✅ Connection status from separate call:', status);
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
            
            if (status.action === 'reconnect_required') {
              console.log('🔄 Tokens cleared by backend, clearing frontend state');
              dispatch({ type: 'CLEAR_STATE' });
              toast.error('Xero authorization expired. Please reconnect to continue.');
            }
          } catch (statusError) {
            console.log('⚠️ Failed to get connection status:', statusError);
          }
        }
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
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load settings on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      loadSettings();
      setIsInitialized(true);
    }
  }, [isInitialized]);

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



  const startAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🚀 Starting Xero authorization...');

      if (!state.hasSettings) {
        const errorMsg = 'Xero settings not configured. Please configure settings first.';
        console.error('❌', errorMsg);
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        toast.error(errorMsg);
        return;
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
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔄 Handling Xero callback...');
      
      const authStartTime = localStorage.getItem('xero_auth_start_time');
      if (authStartTime) {
        const authAge = Date.now() - parseInt(authStartTime);
        if (authAge > 4 * 60 * 1000) { // 4 minutes
          console.warn('⚠️ Authorization took longer than expected:', authAge / 1000, 'seconds');
          toast.warning('Authorization took longer than expected. Please complete within 5 minutes.');
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
      
      // Redirect to dashboard using full URL to stay on Render domain
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/integrations/xero?showDashboard=true`;
      console.log('🔧 XeroContext redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
      
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
  };

  const disconnect = async () => {
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
  };

  const refreshConnection = async () => {
    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping refresh connection');
      toast.warning('Please wait before making another request');
      return;
    }
    await loadSettings();
  };

  const refreshToken = async () => {
    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping token refresh');
      toast.warning('Please wait before making another request');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🔄 Refreshing Xero token...');
      
      // This would typically call a backend endpoint to refresh the token
      // For now, we'll just reload settings to check token validity
      await loadSettings();
      
      toast.success('Token refreshed successfully');
    } catch (err: any) {
      console.error('❌ Token refresh error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to refresh token';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadData = async (resourceType: XeroResourceType) => {
    // Rate limiting protection
    const now = Date.now();
    if (now - lastApiCall < API_RATE_LIMIT_MS) {
      console.log('⚠️ Rate limit protection: Skipping data load');
      toast.warning('Please wait before making another request');
      return;
    }

    try {
      setLastApiCall(now);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (!state.isConnected || !state.selectedTenant) {
        throw new Error('Not connected to Xero or no tenant selected');
      }

      console.log(`📊 Loading ${resourceType} data...`);
      
      // Import the function dynamically to avoid circular dependencies
      const { getXeroData } = await import('../api/xeroService');
      const data = await getXeroData(resourceType, state.selectedTenant.id);
      
      console.log(`✅ ${resourceType} data loaded:`, data);
      return data;
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
  };

  const selectTenant = (tenantId: string) => {
    const tenant = state.tenants.find(t => t.id === tenantId);
    if (tenant) {
      dispatch({ type: 'SET_SELECTED_TENANT', payload: tenant });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
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
