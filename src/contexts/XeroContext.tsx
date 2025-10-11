import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import apiClient from '../api/client';

// Types
interface XeroTenant {
  id: string;
  tenantId: string;
  name: string;
  tenantName: string;
  organizationName: string;
  organizationCountry?: string;
  organizationTaxNumber?: string;
  organizationLegalName?: string;
  organizationShortCode?: string;
}

interface XeroConnectionStatus {
  connected: boolean;
  isTokenValid: boolean;
  expiresAt?: string;
  tenants: XeroTenant[];
  primaryOrganization?: {
    id: string;
    name: string;
  };
  xeroUserId?: string;
  hasExpiredTokens: boolean;
  hasCredentials: boolean;
  needsOAuth: boolean;
  message?: string;
}

interface XeroData {
  invoices?: any;
  contacts?: any;
  basData?: any;
  fasData?: any;
  financialSummary?: any;
  dashboardData?: any;
}

interface XeroState {
  // Connection status
  status: XeroConnectionStatus;
  isLoading: boolean;
  error: string | null;
  
  // Organization selection
  selectedTenant: XeroTenant | null;
  availableTenants: XeroTenant[];
  
  // Data
  data: XeroData;
  dataLoading: boolean;
  dataError: string | null;
  
  // Cache
  lastRefresh: Date | null;
  cacheExpiry: Date | null;
}

type XeroAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: XeroConnectionStatus }
  | { type: 'SET_TENANTS'; payload: XeroTenant[] }
  | { type: 'SELECT_TENANT'; payload: XeroTenant | null }
  | { type: 'SET_DATA_LOADING'; payload: boolean }
  | { type: 'SET_DATA_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: { type: keyof XeroData; data: any } }
  | { type: 'CLEAR_DATA' }
  | { type: 'SET_CACHE_INFO'; payload: { lastRefresh: Date; cacheExpiry: Date } };

// Initial state
const initialState: XeroState = {
  status: {
    connected: false,
    isTokenValid: false,
    tenants: [],
    hasExpiredTokens: false,
    hasCredentials: false,
    needsOAuth: true,
    message: 'Not connected to Xero'
  },
  isLoading: false,
  error: null,
  selectedTenant: null,
  availableTenants: [],
  data: {},
  dataLoading: false,
  dataError: null,
  lastRefresh: null,
  cacheExpiry: null
};

// Reducer
function xeroReducer(state: XeroState, action: XeroAction): XeroState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: action.payload ? state.error : null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_STATUS':
      return { 
        ...state, 
        status: action.payload,
        availableTenants: action.payload.tenants,
        selectedTenant: action.payload.tenants.length > 0 && !state.selectedTenant 
          ? action.payload.tenants[0] 
          : state.selectedTenant,
        isLoading: false,
        error: null
      };
    
    case 'SET_TENANTS':
      return { 
        ...state, 
        availableTenants: action.payload,
        selectedTenant: action.payload.length > 0 && !state.selectedTenant 
          ? action.payload[0] 
          : state.selectedTenant
      };
    
    case 'SELECT_TENANT':
      return { ...state, selectedTenant: action.payload };
    
    case 'SET_DATA_LOADING':
      return { ...state, dataLoading: action.payload, dataError: action.payload ? state.dataError : null };
    
    case 'SET_DATA_ERROR':
      return { ...state, dataError: action.payload, dataLoading: false };
    
    case 'SET_DATA':
      return { 
        ...state, 
        data: { ...state.data, [action.payload.type]: action.payload.data },
        dataLoading: false,
        dataError: null
      };
    
    case 'CLEAR_DATA':
      return { ...state, data: {}, dataError: null };
    
    case 'SET_CACHE_INFO':
      return { 
        ...state, 
        lastRefresh: action.payload.lastRefresh,
        cacheExpiry: action.payload.cacheExpiry
      };
    
    default:
      return state;
  }
}

// Context
interface XeroContextType {
  // State
  status: XeroConnectionStatus;
  isLoading: boolean;
  error: string | null;
  selectedTenant: XeroTenant | null;
  availableTenants: XeroTenant[];
  data: XeroData;
  dataLoading: boolean;
  dataError: string | null;
  lastRefresh: Date | null;
  cacheExpiry: Date | null;
  
  // Actions
  checkConnection: () => Promise<void>;
  connect: () => void;
  disconnect: () => Promise<void>;
  selectTenant: (tenant: XeroTenant | null) => void;
  loadData: (type: 'invoices' | 'contacts' | 'basData' | 'fasData' | 'financialSummary' | 'dashboardData', options?: any) => Promise<any>;
  refreshData: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const XeroContext = createContext<XeroContextType | undefined>(undefined);

// Provider
interface XeroProviderProps {
  children: ReactNode;
}

export function XeroProvider({ children }: XeroProviderProps) {
  const [state, dispatch] = useReducer(xeroReducer, initialState);

  // Check connection status
  const checkConnection = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiClient.get('/xero/status');
      
      if (response.data.success) {
        dispatch({ type: 'SET_STATUS', payload: response.data.data });
        console.log('✅ Xero connection status updated:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to check connection status');
      }
    } catch (error: any) {
      console.error('❌ Error checking connection:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check Xero connection';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Connect to Xero
  const connect = useCallback(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Generate auth URL
      apiClient.get('/xero/connect')
        .then(response => {
          if (response.data.success && response.data.authUrl) {
            // Redirect to Xero OAuth
            window.location.href = response.data.authUrl;
          } else {
            throw new Error(response.data.message || 'Failed to generate OAuth URL');
          }
        })
        .catch(error => {
          console.error('❌ Error connecting to Xero:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to connect to Xero';
          dispatch({ type: 'SET_ERROR', payload: errorMessage });
        });
    } catch (error: any) {
      console.error('❌ Error initiating connection:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to initiate Xero connection' });
    }
  }, []);

  // Disconnect from Xero
  const disconnect = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiClient.delete('/xero/disconnect');
      
      if (response.data.success) {
        dispatch({ type: 'SET_STATUS', payload: initialState.status });
        dispatch({ type: 'CLEAR_DATA' });
        dispatch({ type: 'SELECT_TENANT', payload: null });
        console.log('✅ Successfully disconnected from Xero');
      } else {
        throw new Error(response.data.message || 'Failed to disconnect from Xero');
      }
    } catch (error: any) {
      console.error('❌ Error disconnecting:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to disconnect from Xero';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Select tenant
  const selectTenant = useCallback((tenant: XeroTenant | null) => {
    dispatch({ type: 'SELECT_TENANT', payload: tenant });
    console.log('🏢 Selected tenant:', tenant?.name || 'None');
  }, []);

  // Load data
  const loadData = useCallback(async (
    type: 'invoices' | 'contacts' | 'basData' | 'fasData' | 'financialSummary' | 'dashboardData',
    options: any = {}
  ) => {
    if (!state.selectedTenant) {
      throw new Error('No organization selected. Please select an organization first.');
    }

    if (!state.status.connected || !state.status.isTokenValid) {
      throw new Error('Not connected to Xero or token expired. Please reconnect.');
    }

    try {
      dispatch({ type: 'SET_DATA_LOADING', payload: true });
      
      const endpointMap = {
        invoices: '/xero/invoices',
        contacts: '/xero/contacts',
        basData: '/xero/bas-data',
        fasData: '/xero/fas-data',
        financialSummary: '/xero/financial-summary',
        dashboardData: '/xero/dashboard'
      };

      const endpoint = endpointMap[type];
      if (!endpoint) {
        throw new Error(`Unknown data type: ${type}`);
      }

      const params = {
        tenantId: state.selectedTenant.tenantId || state.selectedTenant.id,
        ...options
      };

      console.log(`📊 Loading ${type} data for tenant ${state.selectedTenant.name}...`);
      
      const response = await apiClient.get(endpoint, { params });
      
      if (response.data.success) {
        const data = response.data.data;
        dispatch({ type: 'SET_DATA', payload: { type, data } });
        
        // Update cache info
        const now = new Date();
        const expiry = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes
        dispatch({ type: 'SET_CACHE_INFO', payload: { lastRefresh: now, cacheExpiry: expiry } });
        
        console.log(`✅ Loaded ${type} data successfully`);
        return data;
      } else {
        throw new Error(response.data.message || `Failed to load ${type} data`);
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${type} data:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to load ${type} data`;
      dispatch({ type: 'SET_DATA_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.selectedTenant, state.status.connected, state.status.isTokenValid]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_DATA_LOADING', payload: true });
      
      // Clear cache first
      await clearCache();
      
      // Reload connection status
      await checkConnection();
      
      console.log('✅ Data refreshed successfully');
    } catch (error: any) {
      console.error('❌ Error refreshing data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh data';
      dispatch({ type: 'SET_DATA_ERROR', payload: errorMessage });
    }
  }, [checkConnection]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      const params: any = {};
      if (state.selectedTenant) {
        params.tenantId = state.selectedTenant.tenantId || state.selectedTenant.id;
      }

      await apiClient.delete('/xero/cache', { params });
      dispatch({ type: 'CLEAR_DATA' });
      console.log('🗑️ Cache cleared successfully');
    } catch (error: any) {
      console.error('❌ Error clearing cache:', error);
      // Don't throw - cache clearing is not critical
    }
  }, [state.selectedTenant]);

  // Check connection on mount and when URL changes
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'true') {
      console.log('✅ OAuth callback successful');
      // Check connection status after successful OAuth
      setTimeout(() => {
        checkConnection();
      }, 1000);
    } else if (success === 'false' && error) {
      console.error('❌ OAuth callback failed:', error);
      dispatch({ type: 'SET_ERROR', payload: decodeURIComponent(error) });
    }
  }, [checkConnection]);

  const contextValue: XeroContextType = {
    // State
    status: state.status,
    isLoading: state.isLoading,
    error: state.error,
    selectedTenant: state.selectedTenant,
    availableTenants: state.availableTenants,
    data: state.data,
    dataLoading: state.dataLoading,
    dataError: state.dataError,
    lastRefresh: state.lastRefresh,
    cacheExpiry: state.cacheExpiry,
    
    // Actions
    checkConnection,
    connect,
    disconnect,
    selectTenant,
    loadData,
    refreshData,
    clearCache
  };

  return (
    <XeroContext.Provider value={contextValue}>
      {children}
    </XeroContext.Provider>
  );
}

// Hook
export function useXero(): XeroContextType {
  const context = useContext(XeroContext);
  if (context === undefined) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  return context;
}