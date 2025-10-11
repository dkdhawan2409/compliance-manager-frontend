import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import apiClient from '../api/client';

// Basic Xero types used across the app
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

interface LegacyXeroConnectionStatus {
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

interface XeroSettings {
  id?: number;
  companyId?: number;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  createdAt?: string;
  updatedAt?: string;
  hasCredentials?: boolean;
  accessToken?: string;
  refreshToken?: string;
  refresh_token?: string;
  tokenExpiresAt?: string;
  company_id?: number;
  [key: string]: any;
}

interface InternalXeroState {
  status: LegacyXeroConnectionStatus;
  isLoading: boolean;
  error: string | null;
  selectedTenant: XeroTenant | null;
  availableTenants: XeroTenant[];
  data: XeroData;
  dataLoading: boolean;
  dataError: string | null;
  lastRefresh: Date | null;
  cacheExpiry: Date | null;
  settings: XeroSettings | null;
}

type XeroAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: LegacyXeroConnectionStatus }
  | { type: 'SET_TENANTS'; payload: XeroTenant[] }
  | { type: 'SELECT_TENANT'; payload: XeroTenant | null }
  | { type: 'SET_DATA_LOADING'; payload: boolean }
  | { type: 'SET_DATA_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: { type: keyof XeroData; data: any } }
  | { type: 'CLEAR_DATA' }
  | { type: 'SET_CACHE_INFO'; payload: { lastRefresh: Date; cacheExpiry: Date } }
  | { type: 'SET_SETTINGS'; payload: XeroSettings | null };

const initialState: InternalXeroState = {
  status: {
    connected: false,
    isTokenValid: false,
    tenants: [],
    hasExpiredTokens: false,
    hasCredentials: false,
    needsOAuth: true,
    message: 'Not connected to Xero',
  },
  isLoading: false,
  error: null,
  selectedTenant: null,
  availableTenants: [],
  data: {},
  dataLoading: false,
  dataError: null,
  lastRefresh: null,
  cacheExpiry: null,
  settings: null,
};

function xeroReducer(state: InternalXeroState, action: XeroAction): InternalXeroState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, dataLoading: false };

    case 'SET_STATUS': {
      const tenants = action.payload.tenants || [];
      const shouldSelectTenant =
        tenants.length > 0 &&
        (!state.selectedTenant ||
          !tenants.find(
            (t) =>
              t.tenantId === state.selectedTenant?.tenantId ||
              t.id === state.selectedTenant?.tenantId ||
              t.id === state.selectedTenant?.id,
          ));

      return {
        ...state,
        status: action.payload,
        availableTenants: tenants,
        selectedTenant: shouldSelectTenant ? tenants[0] : state.selectedTenant,
        isLoading: false,
        error: null,
      };
    }

    case 'SET_TENANTS': {
      const tenants = action.payload;
      const shouldSelectTenant =
        tenants.length > 0 &&
        (!state.selectedTenant ||
          !tenants.find(
            (t) =>
              t.tenantId === state.selectedTenant?.tenantId ||
              t.id === state.selectedTenant?.tenantId ||
              t.id === state.selectedTenant?.id,
          ));

      return {
        ...state,
        availableTenants: tenants,
        selectedTenant: shouldSelectTenant ? tenants[0] : state.selectedTenant,
      };
    }

    case 'SELECT_TENANT':
      return { ...state, selectedTenant: action.payload };

    case 'SET_DATA_LOADING':
      return { ...state, dataLoading: action.payload };

    case 'SET_DATA_ERROR':
      return { ...state, dataError: action.payload, dataLoading: false };

    case 'SET_DATA':
      return {
        ...state,
        data: { ...state.data, [action.payload.type]: action.payload.data },
        dataLoading: false,
        dataError: null,
      };

    case 'CLEAR_DATA':
      return { ...state, data: {}, dataError: null };

    case 'SET_CACHE_INFO':
      return {
        ...state,
        lastRefresh: action.payload.lastRefresh,
        cacheExpiry: action.payload.cacheExpiry,
      };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    default:
      return state;
  }
}

type XeroDataLoadInput =
  | string
  | {
      resourceType: string;
      tenantId?: string;
      [key: string]: any;
    };

interface DerivedXeroState {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  hasSettings: boolean;
  isDemoMode: boolean;
  connectionStatus: {
    isConnected: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'expired' | 'pending' | 'not_configured' | 'error';
    message: string;
    tenants: XeroTenant[];
    hasValidTokens: boolean;
    needsReconnection: boolean;
    lastConnected?: string | null;
    tokenExpiresAt?: string;
  };
  tenants: XeroTenant[];
  selectedTenant: XeroTenant | null;
  settings: XeroSettings | null;
  data: XeroData;
  dataLoading: boolean;
  dataError: string | null;
  lastRefresh: Date | null;
  cacheExpiry: Date | null;
}

interface XeroContextType {
  // Legacy state
  status: LegacyXeroConnectionStatus;
  isLoading: boolean;
  error: string | null;
  selectedTenant: XeroTenant | null;
  availableTenants: XeroTenant[];
  data: XeroData;
  dataLoading: boolean;
  dataError: string | null;
  lastRefresh: Date | null;
  cacheExpiry: Date | null;

  // Core actions
  checkConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  selectTenant: (tenant: XeroTenant | string | null) => void;
  loadData: (input: XeroDataLoadInput, options?: Record<string, any>) => Promise<any>;
  refreshData: () => Promise<void>;
  clearCache: () => Promise<void>;

  // Extended state/actions (plug-and-play compatibility)
  state: DerivedXeroState;
  startAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  refreshToken: (tenantId?: string) => Promise<void>;
  clearError: () => void;
  saveSettings: (settings: Partial<XeroSettings>) => Promise<void>;
  deleteSettings: () => Promise<void>;

  // Convenience getters
  isConnected: boolean;
  hasSettings: boolean;
  tenants: XeroTenant[];
  connectionStatus: DerivedXeroState['connectionStatus'];
}

const XeroContext = createContext<XeroContextType | undefined>(undefined);

interface XeroProviderProps {
  children: ReactNode;
}

const RESOURCE_ENDPOINT_MAP: Record<
  string,
  {
    path: string;
    storeKey?: keyof XeroData;
  }
> = {
  invoices: { path: '/xero/invoices', storeKey: 'invoices' },
  contacts: { path: '/xero/contacts', storeKey: 'contacts' },
  'bas-data': { path: '/xero/bas-data', storeKey: 'basData' },
  'fas-data': { path: '/xero/fas-data', storeKey: 'fasData' },
  'financial-summary': { path: '/xero-plug-play/financial-summary', storeKey: 'financialSummary' },
  'dashboard-data': { path: '/xero-plug-play/dashboard-data', storeKey: 'dashboardData' },
  organization: { path: '/xero-plug-play/organization' },
  accounts: { path: '/xero-plug-play/accounts' },
  'bank-transactions': { path: '/xero-plug-play/bank-transactions' },
  items: { path: '/xero-plug-play/items' },
  'tax-rates': { path: '/xero-plug-play/tax-rates' },
  'tracking-categories': { path: '/xero-plug-play/tracking-categories' },
  'purchase-orders': { path: '/xero-plug-play/purchase-orders' },
  receipts: { path: '/xero-plug-play/receipts' },
  'credit-notes': { path: '/xero-plug-play/credit-notes' },
  'manual-journals': { path: '/xero-plug-play/manual-journals' },
  prepayments: { path: '/xero-plug-play/prepayments' },
  overpayments: { path: '/xero-plug-play/overpayments' },
  quotes: { path: '/xero-plug-play/quotes' },
  payments: { path: '/xero-plug-play/payments' },
  journals: { path: '/xero-plug-play/journals' },
};

const STORE_KEY_MAP: Record<string, keyof XeroData> = {
  invoices: 'invoices',
  contacts: 'contacts',
  'bas-data': 'basData',
  'fas-data': 'fasData',
  'financial-summary': 'financialSummary',
  'dashboard-data': 'dashboardData',
};

function normalizeResourceType(type: string): string {
  if (!type) {
    return '';
  }
  const cleaned = type
    .replace(/([A-Z])/g, '-$1')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

  if (cleaned.startsWith('bas')) {
    return 'bas-data';
  }
  if (cleaned.startsWith('fas')) {
    return 'fas-data';
  }
  if (cleaned === 'financialsummary') {
    return 'financial-summary';
  }
  if (cleaned === 'dashboarddata') {
    return 'dashboard-data';
  }
  return cleaned;
}

function sanitizeParams(params: Record<string, any>): Record<string, any> {
  return Object.entries(params).reduce<Record<string, any>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

export function XeroProvider({ children }: XeroProviderProps) {
  const [state, dispatch] = useReducer(xeroReducer, initialState);

  const derivedState = useMemo<DerivedXeroState>(() => {
    const isConnected = state.status.connected && state.status.isTokenValid;
    const hasSettings = state.status.hasCredentials || !!state.settings;
    const connectionStatus: DerivedXeroState['connectionStatus'] = {
      isConnected,
      connectionStatus: state.error
        ? 'error'
        : isConnected
        ? 'connected'
        : state.status.hasCredentials
        ? state.status.isTokenValid
          ? 'connected'
          : state.status.hasExpiredTokens
          ? 'expired'
          : 'disconnected'
        : 'not_configured',
      message: state.status.message || (isConnected ? 'Connected to Xero' : 'Not connected to Xero'),
      tenants: state.availableTenants,
      hasValidTokens: state.status.isTokenValid,
      needsReconnection: !state.status.isTokenValid || state.status.hasExpiredTokens,
      lastConnected: state.lastRefresh ? state.lastRefresh.toISOString() : null,
      tokenExpiresAt: state.status.expiresAt,
    };

    return {
      isLoading: state.isLoading,
      error: state.error,
      isConnected,
      hasSettings,
      isDemoMode: false,
      connectionStatus,
      tenants: state.availableTenants,
      selectedTenant: state.selectedTenant,
      settings: state.settings,
      data: state.data,
      dataLoading: state.dataLoading,
      dataError: state.dataError,
      lastRefresh: state.lastRefresh,
      cacheExpiry: state.cacheExpiry,
    };
  }, [state]);

  const loadSettings = useCallback(async () => {
    try {
      const response = await apiClient.get('/xero-plug-play/settings');
      if (response.data.success) {
        dispatch({ type: 'SET_SETTINGS', payload: response.data.data });
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        dispatch({ type: 'SET_SETTINGS', payload: null });
        return;
      }
      const message = error.response?.data?.message || error.message || 'Failed to load Xero settings';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, []);

  const checkConnection = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      let statusData: LegacyXeroConnectionStatus | null = null;

      try {
        const response = await apiClient.get('/xero-plug-play/status');
        if (response.data.success && response.data.data) {
          statusData = response.data.data;
        }
      } catch (error) {
        console.warn('⚠️ Failed to load plug-and-play status, trying legacy status endpoint');
      }

      if (!statusData) {
        const legacyResponse = await apiClient.get('/xero/status');
        if (legacyResponse.data.success) {
          statusData = legacyResponse.data.data;
        }
      }

      if (!statusData) {
        throw new Error('Unable to retrieve Xero connection status');
      }

      let tenants: XeroTenant[] = Array.isArray(statusData.tenants) ? statusData.tenants : [];

      if (tenants.length === 0) {
        try {
          const tenantsResponse = await apiClient.get('/xero/tenants');
          if (tenantsResponse.data.success && Array.isArray(tenantsResponse.data.data?.tenants)) {
            tenants = tenantsResponse.data.data.tenants;
          }
        } catch (tenantError) {
          console.warn('⚠️ Failed to load tenants:', tenantError);
        }
      }

      dispatch({
        type: 'SET_STATUS',
        payload: { ...statusData, tenants },
      });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to check Xero connection';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const connect = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const endpoints = ['/xero-plug-play/connect', '/xero/connect'];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get(endpoint);
        if (response.data.success && response.data.data?.authUrl) {
          window.location.href = response.data.data.authUrl;
          return;
        }
        if (response.data.success && response.data.authUrl) {
          window.location.href = response.data.authUrl;
          return;
        }
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to generate OAuth URL');
        }
      } catch (error) {
        console.error(`❌ Failed to get auth URL from ${endpoint}:`, error);
      }
    }

    dispatch({
      type: 'SET_ERROR',
      payload: 'Unable to generate Xero authorization URL. Please check your configuration.',
    });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const startAuth = useCallback(async () => {
    await connect();
  }, [connect]);

  const handleCallback = useCallback(
    async (code: string, oauthState: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await apiClient.post('/xero-plug-play/oauth-callback', { code, state: oauthState });
        await Promise.all([checkConnection(), loadSettings()]);
      } catch (error: any) {
        const message =
          error.response?.data?.message || error.message || 'Failed to complete Xero authorization';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw new Error(message);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [checkConnection, loadSettings],
  );

  const refreshConnection = useCallback(async () => {
    await Promise.all([checkConnection(), loadSettings()]);
  }, [checkConnection, loadSettings]);

  const disconnect = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      try {
        await apiClient.post('/xero-plug-play/disconnect');
      } catch (error) {
        console.warn('⚠️ Plug-and-play disconnect failed, continuing with legacy disconnect');
      }

      const response = await apiClient.delete('/xero/disconnect');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to disconnect from Xero');
      }

      dispatch({ type: 'SET_STATUS', payload: initialState.status });
      dispatch({ type: 'CLEAR_DATA' });
      dispatch({ type: 'SELECT_TENANT', payload: null });
      dispatch({ type: 'SET_SETTINGS', payload: null });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to disconnect from Xero';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const selectTenant = useCallback(
    (tenant: XeroTenant | string | null) => {
      if (!tenant) {
        dispatch({ type: 'SELECT_TENANT', payload: null });
        return;
      }

      if (typeof tenant === 'string') {
        const found =
          state.availableTenants.find((t) => t.tenantId === tenant || t.id === tenant) || null;
        dispatch({ type: 'SELECT_TENANT', payload: found });
        return;
      }

      dispatch({ type: 'SELECT_TENANT', payload: tenant });
    },
    [state.availableTenants],
  );

  const loadData = useCallback(
    async (input: XeroDataLoadInput, options: Record<string, any> = {}) => {
      if (!derivedState.isConnected) {
        throw new Error('Not connected to Xero or token expired. Please reconnect.');
      }

      const request =
        typeof input === 'string'
          ? { resourceType: input, ...options }
          : { ...input, ...(typeof options === 'object' ? options : {}) };

      const resourceType = normalizeResourceType(request.resourceType);
      const storeKey = STORE_KEY_MAP[resourceType];
      const tenantId =
        request.tenantId ||
        state.selectedTenant?.tenantId ||
        state.selectedTenant?.id ||
        state.availableTenants[0]?.tenantId ||
        state.availableTenants[0]?.id;

      if (!tenantId) {
        throw new Error('No organization selected. Please select an organization first.');
      }

      const endpointConfig =
        RESOURCE_ENDPOINT_MAP[resourceType] || { path: `/xero-plug-play/${resourceType}` };
      const params = sanitizeParams({ ...request, tenantId });
      delete params.resourceType;

      dispatch({ type: 'SET_DATA_LOADING', payload: true });

      try {
        const response = await apiClient.get(endpointConfig.path, { params });
        const payload = response.data?.data ?? response.data;

        if (storeKey) {
          dispatch({ type: 'SET_DATA', payload: { type: storeKey, data: payload } });
          const now = new Date();
          const expiry = new Date(now.getTime() + 15 * 60 * 1000);
          dispatch({ type: 'SET_CACHE_INFO', payload: { lastRefresh: now, cacheExpiry: expiry } });
        } else {
          dispatch({ type: 'SET_DATA_LOADING', payload: false });
        }

        return response.data;
      } catch (error: any) {
        const message =
          error.response?.data?.message || error.message || `Failed to load ${resourceType} data`;
        dispatch({ type: 'SET_DATA_ERROR', payload: message });
        throw new Error(message);
      } finally {
        if (!storeKey) {
          dispatch({ type: 'SET_DATA_LOADING', payload: false });
        }
      }
    },
    [derivedState.isConnected, state.selectedTenant, state.availableTenants],
  );

  const clearCache = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      const tenantId =
        state.selectedTenant?.tenantId || state.selectedTenant?.id || state.availableTenants[0]?.tenantId;

      if (tenantId) {
        params.tenantId = tenantId;
      }

      await apiClient.delete('/xero/cache', { params });
      dispatch({ type: 'CLEAR_DATA' });
    } catch (error) {
      console.warn('⚠️ Failed to clear Xero cache:', error);
    }
  }, [state.selectedTenant, state.availableTenants]);

  const refreshData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_DATA_LOADING', payload: true });
      await clearCache();
      await refreshConnection();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to refresh data';
      dispatch({ type: 'SET_DATA_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_DATA_LOADING', payload: false });
    }
  }, [clearCache, refreshConnection]);

  const refreshToken = useCallback(
    async (tenantId?: string) => {
      if (!derivedState.hasSettings) {
        throw new Error('Xero credentials not configured. Please add your Xero client details first.');
      }

      const refreshTokenValue = state.settings?.refreshToken ?? state.settings?.refresh_token;
      const companyId = state.settings?.companyId || state.settings?.company_id;

      if (!refreshTokenValue || !companyId) {
        throw new Error('Refresh token unavailable. Please reconnect to Xero to obtain new tokens.');
      }

      try {
        await apiClient.post('/xero-plug-play/refresh-token', {
          refreshToken: refreshTokenValue,
          companyId,
          tenantId:
            tenantId ||
            state.selectedTenant?.tenantId ||
            state.selectedTenant?.id ||
            state.availableTenants[0]?.tenantId,
        });

        await refreshConnection();
      } catch (error: any) {
        const message =
          error.response?.data?.message || error.message || 'Failed to refresh Xero token';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw new Error(message);
      }
    },
    [
      derivedState.hasSettings,
      state.settings,
      state.selectedTenant,
      state.availableTenants,
      refreshConnection,
    ],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const saveSettings = useCallback(
    async (settings: Partial<XeroSettings>) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await apiClient.post('/xero-plug-play/settings', settings);
        if (response.data.success) {
          dispatch({ type: 'SET_SETTINGS', payload: response.data.data });
          await refreshConnection();
        } else {
          throw new Error(response.data.message || 'Failed to save Xero settings');
        }
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Failed to save Xero settings';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw new Error(message);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [refreshConnection],
  );

  const deleteSettings = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await apiClient.delete('/xero-plug-play/settings');
      dispatch({ type: 'SET_SETTINGS', payload: null });
      await refreshConnection();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete Xero settings';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [refreshConnection]);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const errorParam = urlParams.get('error');

    if (success === 'true' || success === 'connected') {
      setTimeout(() => {
        refreshConnection();
      }, 1000);
    } else if (success === 'false' && errorParam) {
      dispatch({ type: 'SET_ERROR', payload: decodeURIComponent(errorParam) });
    }
  }, [refreshConnection]);

  const contextValue: XeroContextType = {
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

    checkConnection,
    connect,
    disconnect,
    selectTenant,
    loadData,
    refreshData,
    clearCache,

    state: derivedState,
    startAuth,
    handleCallback,
    loadSettings,
    refreshConnection,
    refreshToken,
    clearError,
    saveSettings,
    deleteSettings,

    isConnected: derivedState.isConnected,
    hasSettings: derivedState.hasSettings,
    tenants: derivedState.tenants,
    connectionStatus: derivedState.connectionStatus,
  };

  return <XeroContext.Provider value={contextValue}>{children}</XeroContext.Provider>;
}

export function useXero(): XeroContextType {
  const context = useContext(XeroContext);
  if (context === undefined) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  return context;
}
 