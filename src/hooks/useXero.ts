import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';
import {
  getXeroAuthUrl,
  handleXeroCallback,
  getXeroCompanyInfo,
  refreshXeroToken,
  getXeroData,
  saveXeroSettings,
  getXeroSettings,
  getConnectionStatus,
  deleteXeroSettings,
  getAllXeroSettings,
  type XeroTokens,
  type XeroTenant,
  type XeroCompanyInfo,
  type XeroResourceType,
  type XeroSettings,
} from '../api/xeroService';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface UseXeroReturn {
  // State
  tokens: XeroTokens | null;
  tenants: XeroTenant[];
  selectedTenant: XeroTenant | null;
  companyInfo: XeroCompanyInfo | null;
  settings: XeroSettings | null;
  isLoading: boolean;
  error: string | null;
  connectionStatus: {
    isConnected: boolean | string;
    connectionStatus: string;
    message: string;
    tenants?: XeroTenant[];
    action?: string;
  } | null;
  
  // Actions
  startAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  disconnect: () => Promise<void>;
  loadData: (resourceType: XeroResourceType) => Promise<any>;
  selectTenant: (tenantId: string) => void;
  loadCompanyInfo: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: { clientId: string; clientSecret: string; redirectUri: string }) => Promise<void>;
  deleteSettings: () => Promise<void>;
  
  // Computed
  isConnected: boolean;
  canAccess: boolean;
  hasSettings: boolean;
}

export const useXero = (): UseXeroReturn => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  const [tokens, setTokens] = useState<XeroTokens | null>(null);
  const [tenants, setTenants] = useState<XeroTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<XeroTenant | null>(null);
  const [companyInfo, setCompanyInfo] = useState<XeroCompanyInfo | null>(null);
  const [settings, setSettings] = useState<XeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean | string;
    connectionStatus: string;
    message: string;
    tenants?: XeroTenant[];
  } | null>(null);

  // Use connection status from backend as primary source
  // Add debugging to understand the issue
  // Handle both boolean and string "true" values from backend
  const isConnected = connectionStatus?.isConnected === true || connectionStatus?.isConnected === 'true';
  
  // Debug logging for connection status
  console.log('🔍 Connection Status Debug:', {
    connectionStatus,
    isConnected,
    connectionStatusIsConnected: connectionStatus?.isConnected,
    strictComparison: connectionStatus?.isConnected === true,
    connectionStatusType: typeof connectionStatus?.isConnected,
    connectionStatusValue: connectionStatus?.isConnected
  });
  const canAccess = !company?.superadmin && (companyInfo?.isEnrolled || false);
  const hasSettings = !!settings;
  
  // Debug logging
  console.log('useXero hook state:', { 
    hasSettings, 
    settings: !!settings, 
    settingsData: settings,
    connectionStatus,
    isConnected,
    canAccess 
  });

  const startAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 Starting Xero authorization...');

      // Check if we have settings configured
      if (!hasSettings) {
        const errorMsg = 'Xero settings not configured. Please configure settings first.';
        console.error('❌', errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Clear any existing tokens and authorization state to force fresh authorization
      localStorage.removeItem('xero_tokens');
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');
      setTokens(null);
      setConnectionStatus(null);
      console.log('🧹 Cleared existing tokens and authorization state for fresh authorization');

      // Use the old flow since new endpoints may not be implemented yet
      console.log('🔐 Using original Xero auth flow...');
      const { authUrl } = await getXeroAuthUrl();
      console.log('✅ Auth URL received:', authUrl);
      
      // Validate auth URL
      if (!authUrl || !authUrl.startsWith('https://login.xero.com/')) {
        throw new Error('Invalid authorization URL received from backend');
      }
      
      // Store timestamp for auth start to track timing
      localStorage.setItem('xero_auth_start_time', Date.now().toString());
      
      // Redirect to Xero
      console.log('🔄 Redirecting to Xero...');
      window.location.href = authUrl;
      
    } catch (err: any) {
      console.error('❌ Xero auth error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
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
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [hasSettings]);

  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if auth flow took too long (authorization codes expire quickly)
      const authStartTime = localStorage.getItem('xero_auth_start_time');
      if (authStartTime) {
        const elapsed = Date.now() - parseInt(authStartTime);
        const maxAuthTime = 4 * 60 * 1000; // 4 minutes max
        if (elapsed > maxAuthTime) {
          console.warn('⚠️ Authorization flow took too long:', elapsed, 'ms');
          toast.error('Authorization took too long. Please try again quickly.');
        }
      }
      
      const result = await handleXeroCallback(code, state);
      
      // Clear auth start time on success
      localStorage.removeItem('xero_auth_start_time');
      
      // Store authorization state in localStorage for persistence
      localStorage.setItem('xero_authorized', 'true');
      localStorage.setItem('xero_auth_timestamp', Date.now().toString());
      
      setTokens(result.tokens);
      setTenants(result.tenants);
      setSelectedTenant(result.tenants[0] || null);
      
      // Update connection status immediately after successful authorization
      const newConnectionStatus = {
        isConnected: true,
        connectionStatus: 'connected',
        message: 'Xero connected successfully',
        tenants: result.tenants || []
      };
      setConnectionStatus(newConnectionStatus);
      
      toast.success('Xero integration successful!');
      
      // Force refresh settings to ensure backend state is synced
      setTimeout(async () => {
        try {
          const settingsData = await getXeroSettings();
          setSettings(settingsData);
          if (settingsData?.isConnected) {
            const newConnectionStatus = {
              isConnected: true,
              connectionStatus: 'connected',
              message: 'Xero connected successfully',
              tenants: settingsData.tenants || []
            };
            setConnectionStatus(newConnectionStatus);
          }
        } catch (refreshError) {
          console.log('⚠️ Failed to refresh settings after auth:', refreshError);
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('❌ Callback error:', err.response?.data || err.message);
      
      // Clear auth start time on error
      localStorage.removeItem('xero_auth_start_time');
      localStorage.removeItem('xero_authorized');
      localStorage.removeItem('xero_auth_timestamp');
      
      // Handle specific error types
      if (err.response?.data?.code === 'EXPIRED_CODE' || 
          err.response?.data?.message?.includes('expired') ||
          err.response?.data?.error?.includes('expired')) {
        const errorMessage = 'Authorization code has expired. Please try connecting to Xero again quickly.';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Show helpful message about quick authorization
        setTimeout(() => {
          toast.success('💡 Tip: Complete the Xero authorization within 5 minutes to avoid expired codes.');
        }, 2000);
      } else if (err.response?.data?.code === 'INVALID_CLIENT') {
        const errorMessage = 'Invalid Xero credentials. Please check your Client ID and Secret.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.response?.data?.code === 'INVALID_REDIRECT_URI') {
        const errorMessage = 'Invalid redirect URI. Please check your Xero app configuration.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to complete Xero authorization';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken || !company?.id) return;

    try {
      const newTokens = await refreshXeroToken(tokens.refreshToken, company.id);
      setTokens(newTokens);
      toast.success('Token refreshed successfully');
    } catch (err: any) {
      toast.error('Failed to refresh token');
    }
  }, [tokens?.refreshToken, company?.id]);

  const loadData = useCallback(async (resourceType: XeroResourceType) => {
    if (!isConnected || !selectedTenant) {
      throw new Error('Not connected to Xero');
    }

    console.log('🔍 Loading data:', { resourceType, tenantId: selectedTenant.id, isConnected });
    
    try {
      // Use the backend's data loading endpoint which handles tokens internally
      const data = await getXeroData(resourceType, selectedTenant.id);
      return data.data;
    } catch (err: any) {
      // Handle 401 errors - tokens have been cleared by backend
      if (err.response?.status === 401 && err.response?.data?.action === 'reconnect_required') {
        console.log('❌ 401 Unauthorized - Tokens cleared by backend, clearing frontend state');
        
        // Clear frontend state
        setTokens(null);
        setConnectionStatus(null);
        localStorage.removeItem('xero_authorized');
        localStorage.removeItem('xero_auth_timestamp');
        
        // Show reconnection message
        toast.error('Xero authorization expired. Please reconnect to continue.');
        
        throw new Error('Xero authorization expired. Please reconnect to continue.');
      }
      
      // Re-throw other errors
      throw err;
    }
  }, [isConnected, selectedTenant]);

  const selectTenant = useCallback((tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setSelectedTenant(tenant || null);
  }, [tenants]);

  const loadCompanyInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const info = await getXeroCompanyInfo();
      setCompanyInfo(info);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load company information';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      console.log('Loading Xero settings...');
      setIsLoading(true);
      setError(null);
      
      const settingsData = await getXeroSettings();
      console.log('Settings loaded:', settingsData);
      setSettings(settingsData);
      
      // Check connection status if we have settings
      if (settingsData) {
        console.log('🔍 Processing settings data:', settingsData);
        
        // Use connection status from settings response if available
        if (settingsData.isConnected !== undefined) {
          console.log('✅ Connection status from settings:', settingsData);
          const newConnectionStatus = {
            isConnected: Boolean(settingsData.isConnected),
            connectionStatus: settingsData.connectionStatus || 'unknown',
            message: settingsData.isConnected ? 'Xero connected successfully' : 'Not connected to Xero',
            tenants: settingsData.tenants || []
          };
          
          console.log('🔧 Setting connection status:', newConnectionStatus);
          console.log('🔧 isConnected value:', settingsData.isConnected, 'type:', typeof settingsData.isConnected);
          console.log('🔧 Boolean conversion:', Boolean(settingsData.isConnected));
          setConnectionStatus(newConnectionStatus);
          
          // Update tenants if available
          if (settingsData.tenants && settingsData.tenants.length > 0) {
            console.log('🔧 Setting tenants:', settingsData.tenants);
            setTenants(settingsData.tenants);
            if (!selectedTenant) {
              setSelectedTenant(settingsData.tenants[0]);
            }
          }
        } else {
          // Fallback to separate connection status call
          try {
            const status = await getConnectionStatus();
            console.log('✅ Connection status from separate call:', status);
            setConnectionStatus(status);
            
            // Check if tokens were cleared by backend
            if (status.action === 'reconnect_required') {
              console.log('🔄 Tokens cleared by backend, clearing frontend state');
              setTokens(null);
              localStorage.removeItem('xero_authorized');
              localStorage.removeItem('xero_auth_timestamp');
              toast.error('Xero authorization expired. Please reconnect to continue.');
            }
            
            // Update tenants if available
            if (status.tenants && status.tenants.length > 0) {
              setTenants(status.tenants);
              if (!selectedTenant) {
                setSelectedTenant(status.tenants[0]);
              }
            }
          } catch (statusError) {
            console.log('⚠️ Failed to get connection status:', statusError);
          }
        }
      }
    } catch (err: any) {
      console.log('Settings load error:', err.response?.status, err.response?.data);
      // Settings not found is not an error, just means not configured
      if (err.response?.status !== 404) {
        const errorMessage = err.response?.data?.message || 'Failed to load Xero settings';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenant]);

  // Force refresh connection status if we have settings but no connection status
  useEffect(() => {
    if (settings && !connectionStatus) {
      console.log('🔄 Force refreshing connection status...');
      loadSettings();
    }
  }, [settings, connectionStatus, loadSettings]);

  // Force synchronization when connection status changes
  useEffect(() => {
    console.log('🔄 Connection status changed:', connectionStatus);
    console.log('🔄 isConnected computed value:', isConnected);
  }, [connectionStatus, isConnected]);

  // Check for existing authorization state on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const isAuthorized = localStorage.getItem('xero_authorized');
      const authTimestamp = localStorage.getItem('xero_auth_timestamp');
      
      if (isAuthorized === 'true' && authTimestamp) {
        const authAge = Date.now() - parseInt(authTimestamp);
        const maxAuthAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (authAge < maxAuthAge) {
          console.log('🔍 Found existing authorization, checking status...');
          try {
            const settingsData = await getXeroSettings();
            if (settingsData?.isConnected) {
              console.log('✅ Existing authorization is still valid');
              const newConnectionStatus = {
                isConnected: true,
                connectionStatus: 'connected',
                message: 'Xero connected successfully',
                tenants: settingsData.tenants || []
              };
              setConnectionStatus(newConnectionStatus);
              setSettings(settingsData);
              if (settingsData.tenants && settingsData.tenants.length > 0) {
                setTenants(settingsData.tenants);
                if (!selectedTenant) {
                  setSelectedTenant(settingsData.tenants[0]);
                }
              }
            } else {
              console.log('⚠️ Existing authorization is no longer valid');
              localStorage.removeItem('xero_authorized');
              localStorage.removeItem('xero_auth_timestamp');
            }
          } catch (error) {
            console.log('⚠️ Failed to verify existing authorization:', error);
            localStorage.removeItem('xero_authorized');
            localStorage.removeItem('xero_auth_timestamp');
          }
        } else {
          console.log('⚠️ Existing authorization has expired');
          localStorage.removeItem('xero_authorized');
          localStorage.removeItem('xero_auth_timestamp');
        }
      }
    };
    
    checkExistingAuth();
  }, [selectedTenant]);

  const saveSettings = useCallback(async (settingsData: { clientId: string; clientSecret: string; redirectUri: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const savedSettings = await saveXeroSettings(settingsData);
      setSettings(savedSettings);
      toast.success('Xero settings saved successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save Xero settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteXeroSettings();
      setSettings(null);
      toast.success('Xero settings deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Xero settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔌 Disconnecting from Xero...');
      
      // Clear frontend state
      setTokens(null);
      setTenants([]);
      setSelectedTenant(null);
      setConnectionStatus(null);
      
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
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    tokens,
    tenants,
    selectedTenant,
    companyInfo,
    settings,
    isLoading,
    error,
    connectionStatus,
    
    // Actions
    startAuth,
    handleCallback,
    refreshToken,
    disconnect,
    loadData,
    selectTenant,
    loadCompanyInfo,
    loadSettings,
    saveSettings,
    deleteSettings,
    
    // Computed
    isConnected,
    canAccess,
    hasSettings,
  };
}; 