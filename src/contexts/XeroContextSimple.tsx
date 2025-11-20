import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getXeroSettings, 
  getConnectionStatus, 
  getXeroAuthUrl, 
  handleXeroCallback,
  deleteXeroSettings 
} from '../api/xeroService';
import { getApiUrl } from '../utils/envChecker';
import { useAuth } from './AuthContext';

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

export interface XeroState {
  isConnected: boolean;
  hasSettings: boolean;
  selectedTenant: XeroTenant | null;
  tenants: XeroTenant[];
  settings: XeroSettings | null;
  connectionStatus: string;
  error: string | null;
  isLoading: boolean;
  tokens: XeroTokens | null;
}

// Action Types
type XeroAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: string }
  | { type: 'SET_TENANTS'; payload: XeroTenant[] }
  | { type: 'SET_SELECTED_TENANT'; payload: XeroTenant | null }
  | { type: 'SET_SETTINGS'; payload: XeroSettings | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TOKENS'; payload: XeroTokens | null }
  | { type: 'CLEAR_STATE' };

// Initial State
const initialState: XeroState = {
  isConnected: false,
  hasSettings: false,
  selectedTenant: null,
  tenants: [],
  settings: null,
  connectionStatus: 'disconnected',
  error: null,
  isLoading: false,
  tokens: null,
};

// Reducer
const xeroReducer = (state: XeroState, action: XeroAction): XeroState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_TENANTS':
      return { ...state, tenants: action.payload };
    case 'SET_SELECTED_TENANT':
      return { ...state, selectedTenant: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, hasSettings: !!action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    case 'CLEAR_STATE':
      return initialState;
    default:
      return state;
  }
};

// Context
interface XeroContextType {
  state: XeroState;
  startAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  disconnect: () => Promise<void>;
  loadSettings: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  selectTenant: (tenant: XeroTenant) => void;
  clearError: () => void;
}

const XeroContext = createContext<XeroContextType | undefined>(undefined);

// Provider
export const XeroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(xeroReducer, initialState);
  const { isAuthenticated, company } = useAuth();

  // Load initial state
  useEffect(() => {
    if (isAuthenticated && company) {
      loadSettings();
      refreshConnection();
    }
  }, [isAuthenticated, company]);

  const startAuth = async () => {
    if (!isAuthenticated || !company) {
      throw new Error('User not authenticated');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const authUrl = await getXeroAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Start Auth Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to start authentication' });
      throw error;
    }
  };

  const handleCallback = async (code: string, state: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await handleXeroCallback(code, state);
      
      if (result.success) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        
        if (result.tenants && result.tenants.length > 0) {
          dispatch({ type: 'SET_TENANTS', payload: result.tenants });
          if (result.tenants.length === 1) {
            dispatch({ type: 'SET_SELECTED_TENANT', payload: result.tenants[0] });
          }
        }
        
        toast.success('Successfully connected to Xero!');
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Callback Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Authentication failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disconnect = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await deleteXeroSettings();
      dispatch({ type: 'CLEAR_STATE' });
      toast.success('Successfully disconnected from Xero');
    } catch (error: any) {
      console.error('Disconnect Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to disconnect' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadSettings = async () => {
    if (!isAuthenticated || !company) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const settings = await getXeroSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    } catch (error: any) {
      console.error('Load Settings Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load settings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshConnection = async () => {
    if (!isAuthenticated || !company) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const status = await getConnectionStatus();
      
      if (status.isConnected) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        
        if (status.tenants && status.tenants.length > 0) {
          dispatch({ type: 'SET_TENANTS', payload: status.tenants });
          if (!state.selectedTenant && status.tenants.length === 1) {
            dispatch({ type: 'SET_SELECTED_TENANT', payload: status.tenants[0] });
          }
        }
      } else {
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
      }
    } catch (error: any) {
      console.error('Refresh Connection Error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh connection' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const selectTenant = (tenant: XeroTenant) => {
    dispatch({ type: 'SET_SELECTED_TENANT', payload: tenant });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: XeroContextType = {
    state,
    startAuth,
    handleCallback,
    disconnect,
    loadSettings,
    refreshConnection,
    selectTenant,
    clearError,
  };

  return (
    <XeroContext.Provider value={contextValue}>
      {children}
    </XeroContext.Provider>
  );
};

// Hook
export const useXero = () => {
  const context = useContext(XeroContext);
  if (context === undefined) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  
  return {
    // Flattened state for easier access
    isConnected: context.state.isConnected,
    hasSettings: context.state.hasSettings,
    selectedTenant: context.state.selectedTenant,
    tenants: context.state.tenants,
    settings: context.state.settings,
    connectionStatus: context.state.connectionStatus,
    error: context.state.error,
    isLoading: context.state.isLoading,
    tokens: context.state.tokens,
    
    // Actions
    startAuth: context.startAuth,
    handleCallback: context.handleCallback,
    disconnect: context.disconnect,
    loadSettings: context.loadSettings,
    refreshConnection: context.refreshConnection,
    selectTenant: context.selectTenant,
    clearError: context.clearError,
  };
};















