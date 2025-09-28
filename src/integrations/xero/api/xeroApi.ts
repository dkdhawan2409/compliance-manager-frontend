// Xero API Client
// Comprehensive API client for Xero integration with automatic token management, error handling, and retry logic

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  XeroConfig, 
  XeroTokens, 
  XeroTenant, 
  XeroApiResponse, 
  XeroDataRequest, 
  XeroDataResponse,
  XeroSettings,
  XeroConnectionStatus,
  XeroFinancialSummary,
  XeroDashboardData,
  XeroResourceType,
} from '../types';
import { 
  XERO_API_LIMITS, 
  XERO_ERROR_CODES, 
  XERO_MESSAGES,
  XERO_LOCAL_STORAGE_KEYS,
} from '../constants';

export class XeroApiClient {
  private client: AxiosInstance;
  private config: XeroConfig;
  private tokens: XeroTokens | null = null;
  private refreshPromise: Promise<XeroTokens> | null = null;

  constructor(config: XeroConfig) {
    this.config = config;
    this.client = this.createAxiosClient();
    this.loadTokensFromStorage();
    this.setupInterceptors();
  }

  private createAxiosClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: XERO_API_LIMITS.REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return client;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log Xero API requests
        if (config.url?.includes('/xero/')) {
          console.log('🔐 Xero API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            hasToken: !!token,
            timestamp: new Date().toISOString(),
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (response.config.url?.includes('/xero/')) {
          console.log('✅ Xero API Response:', {
            status: response.status,
            url: response.config.url,
            timestamp: new Date().toISOString(),
          });
        }
        return response;
      },
      async (error) => {
        if (error.config?.url?.includes('/xero/')) {
          console.error('❌ Xero API Error:', {
            status: error.response?.status,
            url: error.config.url,
            message: error.message,
            timestamp: new Date().toISOString(),
          });

          // Handle token refresh for 401 errors
          if (error.response?.status === 401 && this.tokens && this.config.autoRefreshTokens) {
            try {
              await this.refreshAccessToken();
              // Retry the original request
              return this.client.request(error.config);
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
              this.clearTokens();
            }
          }
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private loadTokensFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
      if (storedTokens) {
        this.tokens = JSON.parse(storedTokens);
      }
    } catch (error) {
      console.error('❌ Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  private saveTokensToStorage(tokens: XeroTokens): void {
    try {
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());
      localStorage.setItem(XERO_LOCAL_STORAGE_KEYS.LAST_REFRESH, Date.now().toString());
    } catch (error) {
      console.error('❌ Failed to save tokens to storage:', error);
    }
  }

  private clearTokens(): void {
    this.tokens = null;
    localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.TOKENS);
    localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.AUTH_TIMESTAMP);
    localStorage.removeItem(XERO_LOCAL_STORAGE_KEYS.LAST_REFRESH);
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data?.message || XERO_MESSAGES.VALIDATION_ERROR);
        case 401:
          return new Error(XERO_MESSAGES.UNAUTHORIZED);
        case 403:
          return new Error(XERO_MESSAGES.FORBIDDEN);
        case 404:
          return new Error(XERO_MESSAGES.NOT_FOUND);
        case 429:
          return new Error(XERO_MESSAGES.RATE_LIMIT_EXCEEDED);
        case 500:
          return new Error(XERO_MESSAGES.SERVER_ERROR);
        default:
          return new Error(data?.message || XERO_MESSAGES.SERVER_ERROR);
      }
    } else if (error.request) {
      return new Error(XERO_MESSAGES.NETWORK_ERROR);
    } else {
      return new Error(error.message || XERO_MESSAGES.SERVER_ERROR);
    }
  }

  // Settings Management
  async saveSettings(settings: Partial<XeroSettings>): Promise<XeroSettings> {
    try {
      const response = await this.client.post('/settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to save Xero settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<XeroSettings & {
    isConnected?: boolean;
    connectionStatus?: string;
    tenants?: XeroTenant[];
    hasValidTokens?: boolean;
  }> {
    try {
      const response = await this.client.get('/settings');
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to get Xero settings:', error);
      throw error;
    }
  }

  async deleteSettings(): Promise<void> {
    try {
      await this.client.delete('/settings');
    } catch (error) {
      console.error('❌ Failed to delete Xero settings:', error);
      throw error;
    }
  }

  // Connection Status
  async getConnectionStatus(): Promise<XeroConnectionStatus> {
    try {
      const response = await this.client.get('/status');
      const backendData = response.data.data;
      
      return {
        isConnected: backendData.connected || false,
        connectionStatus: backendData.connected ? 'connected' : 'disconnected',
        message: backendData.connected ? XERO_MESSAGES.CONNECT_SUCCESS : 'Not connected to Xero',
        tenants: backendData.tenants || [],
        hasCredentials: backendData.hasCredentials || false,
        needsReconnection: backendData.needsOAuth || false,
        lastConnected: backendData.lastConnected,
      };
    } catch (error) {
      console.error('❌ Failed to get connection status:', error);
      throw error;
    }
  }

  // OAuth Flow
  async getAuthUrl(): Promise<{ authUrl: string; state: string }> {
    try {
      const state = this.generateState();
      const response = await this.client.get('/connect', {
        params: {
          redirect_uri: this.config.redirectUri,
          state: state,
        },
      });

      console.log('🔧 Backend response structure:', response.data);

      // Handle nested response structure from backend
      const authUrl = response.data?.data?.authUrl || response.data?.authUrl;
      
      if (!authUrl) {
        console.error('❌ No authUrl found in response:', response.data);
        throw new Error('No authorization URL received from backend');
      }

      return {
        authUrl: authUrl,
        state: state,
      };
    } catch (error) {
      console.error('❌ Failed to get auth URL:', error);
      throw error;
    }
  }

  async handleCallback(code: string, state: string): Promise<{
    tokens: XeroTokens;
    tenants: XeroTenant[];
    companyId: string;
  }> {
    try {
      const response = await this.client.post('/oauth-callback', {
        code,
        state,
        redirect_uri: this.config.redirectUri,
      });

      const result = response.data.data;
      this.tokens = result.tokens;
      this.saveTokensToStorage(result.tokens);

      return result;
    } catch (error) {
      console.error('❌ OAuth callback failed:', error);
      throw error;
    }
  }

  // Token Management
  async refreshAccessToken(): Promise<XeroTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newTokens = await this.refreshPromise;
      this.tokens = newTokens;
      this.saveTokensToStorage(newTokens);
      return newTokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<XeroTokens> {
    try {
      const response = await this.client.post('/refresh-token', {
        refreshToken: this.tokens?.refreshToken,
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Data Access
  async loadData<T = any>(request: XeroDataRequest): Promise<XeroDataResponse<T>> {
    try {
      const { resourceType, tenantId, page = 1, pageSize = 50, filters, dateFrom, dateTo } = request;
      
      let url = `/xero/${resourceType}`;
      const params: any = { page, pageSize };
      
      if (tenantId) params.tenantId = tenantId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (filters) params.filters = JSON.stringify(filters);

      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to load ${request.resourceType}:`, error);
      throw error;
    }
  }

  // Specific Data Methods
  async getDashboardData(tenantId?: string): Promise<XeroDataResponse<XeroDashboardData>> {
    return this.loadData({ resourceType: 'dashboard-data', tenantId });
  }

  async getFinancialSummary(tenantId?: string): Promise<XeroDataResponse<XeroFinancialSummary>> {
    return this.loadData({ resourceType: 'financial-summary', tenantId });
  }

  async getInvoices(tenantId?: string, page = 1, pageSize = 50): Promise<XeroDataResponse<any>> {
    return this.loadData({ resourceType: 'invoices', tenantId, page, pageSize });
  }

  async getContacts(tenantId?: string, page = 1, pageSize = 50): Promise<XeroDataResponse<any>> {
    return this.loadData({ resourceType: 'contacts', tenantId, page, pageSize });
  }

  async getAccounts(tenantId?: string): Promise<XeroDataResponse<any>> {
    return this.loadData({ resourceType: 'accounts', tenantId });
  }

  async getBankTransactions(tenantId?: string, page = 1, pageSize = 50): Promise<XeroDataResponse<any>> {
    return this.loadData({ resourceType: 'bank-transactions', tenantId, page, pageSize });
  }

  async getOrganization(tenantId?: string): Promise<XeroDataResponse<any>> {
    return this.loadData({ resourceType: 'organization', tenantId });
  }

  // Utility Methods
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    
    const now = Date.now();
    const issuedAt = this.tokens.issuedAt || 0;
    const expiresAt = issuedAt + (this.tokens.expiresIn * 1000);
    const threshold = XERO_API_LIMITS.TOKEN_REFRESH_THRESHOLD_MINUTES * 60 * 1000;
    
    return now >= (expiresAt - threshold);
  }

  getCurrentTokens(): XeroTokens | null {
    return this.tokens;
  }

  updateConfig(newConfig: Partial<XeroConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.client.defaults.baseURL = this.config.apiBaseUrl;
  }

  // Demo Mode Support
  async getDemoData(resourceType: XeroResourceType): Promise<XeroDataResponse<any>> {
    try {
      const response = await this.client.get(`/demo/${resourceType}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to load demo ${resourceType}:`, error);
      throw error;
    }
  }
}

// Factory function to create API client
export const createXeroApi = (config: XeroConfig): XeroApiClient => {
  return new XeroApiClient(config);
};

// Default export for convenience
export const xeroApi = createXeroApi({
  clientId: '',
  redirectUri: '',
  scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings'],
  apiBaseUrl: '/api/xero',
  autoRefreshTokens: true,
  enableDemoMode: false,
});
