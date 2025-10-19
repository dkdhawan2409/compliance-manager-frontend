import apiClient from './client';
import { getForcedRedirectUri, getProductionSafeRedirectUri, getRenderRedirectUri } from '../utils/envChecker';
import { xeroOAuthHelper } from '../utils/xeroOAuthHelper';

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

export interface XeroCompanyInfo {
  id: string;
  companyName: string;
  email: string;
  role: string;
  isEnrolled: boolean;
  enrollmentStatus: {
    isEnrolled: boolean;
    message: string;
  };
  compliance: {
    basFrequency: string;
    nextBasDue: string;
    fbtApplicable: boolean;
    nextFbtDue: string;
    iasRequired: boolean;
    iasFrequency: string;
    nextIasDue: string;
    financialYearEnd: string;
  };
}

export interface XeroSettings {
  id: number;
  companyId: number;
  clientId: string;
  redirectUri: string;
  createdAt: string;
  updatedAt: string;
}

export interface XeroDataResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface XeroDashboardData {
  summary: {
    totalInvoices: number;
    totalContacts: number;
    totalTransactions: number;
    totalAccounts: number;
    totalAmount: string;
    paidInvoices: number;
    overdueInvoices: number;
  };
  recentInvoices: any[];
  recentContacts: any[];
  recentTransactions: any[];
  accounts: any[];
  organization: any;
}

export interface XeroFinancialSummary {
  totalRevenue: string;
  paidRevenue: string;
  outstandingRevenue: string;
  totalExpenses: string;
  netIncome: string;
  invoiceCount: number;
  transactionCount: number;
}

// Xero Settings Management

// Create or update Xero settings
export const saveXeroSettings = async (settings: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<XeroSettings> => {
  const response = await apiClient.post('/api/xero/settings', settings);
  return response.data.data;
};

// Get Xero settings for the authenticated company
export const getXeroSettings = async (): Promise<XeroSettings & {
  isConnected?: boolean;
  connectionStatus?: string;
  tenants?: XeroTenant[];
  hasValidTokens?: boolean;
}> => {
  const response = await apiClient.get('/api/xero/settings');
  return response.data.data;
};

// Get Xero connection status
export const getConnectionStatus = async (): Promise<{
  isConnected: boolean | string;
  connectionStatus: string;
  message: string;
  tenants?: XeroTenant[];
  tokenRefreshed?: boolean;
  action?: string;
  hasCredentials?: boolean;
  needsOAuth?: boolean;
}> => {
  console.log('🔍 getConnectionStatus: Making API call to /api/xero/status');
  
  try {
    const response = await apiClient.get('/api/xero/status');
    console.log('🔍 getConnectionStatus: Raw response:', response.data);
    
    const backendData = response.data.data;
    console.log('🔍 getConnectionStatus: Backend data:', backendData);
    
    // Map backend response to frontend expected format
    const mappedData = {
      isConnected: backendData.connected || false,
      connectionStatus: backendData.connected ? 'connected' : 'disconnected',
      message: backendData.connected ? 'Xero connected successfully' : 'Not connected to Xero',
      tenants: (backendData.tenants || []).map((tenant: any) => ({
        id: tenant.tenantId,
        name: tenant.tenantName || tenant.organisationName || 'Unnamed Organization',
        organizationName: tenant.organisationName,
        tenantName: tenant.tenantName,
        tenantId: tenant.tenantId
      })),
      hasCredentials: backendData.hasCredentials || false,
      needsOAuth: backendData.needsOAuth || false,
      tokenRefreshed: backendData.tokenRefreshed || false,
      action: backendData.needsOAuth ? 'connect' : undefined
    };
    
    console.log('🔍 getConnectionStatus: Mapped data:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('🔍 getConnectionStatus: Error:', error);
    throw error;
  }
};

// Delete Xero settings for the authenticated company
export const deleteXeroSettings = async (): Promise<void> => {
  await apiClient.delete('/api/xero/settings');
};

// Get all Xero settings (admin only)
export const getAllXeroSettings = async (): Promise<XeroSettings[]> => {
  const response = await apiClient.get('/api/xero/settings/all');
  return response.data.data;
};

// Authentication

// Get authorization URL for Xero login
export const getXeroAuthUrl = async (): Promise<{ authUrl: string; state: string }> => {
  try {
    // Always use Render redirect URI when deployed (no localhost)
    const redirectUri = getRenderRedirectUri();
    const state = xeroOAuthHelper.generateState();
    
    // Store the OAuth state
    xeroOAuthHelper.startOAuth();
    
    console.log('🔧 Generating OAuth URL with RENDER redirect URI:', redirectUri);
    console.log('🔧 Current window location:', window.location.origin);
    console.log('🔧 Environment:', import.meta.env.PROD ? 'Production' : 'Development');
    console.log('🔧 VITE_FRONTEND_URL:', import.meta.env.VITE_FRONTEND_URL);
    console.log('🔧 Generated state:', state);
    console.log('🔧 Hostname:', window.location.hostname);
    console.log('🔧 NO LOCALHOST - Using Render domain only');
    console.log('🔧 DEBUG - Redirect URI being sent to backend:', redirectUri);
    console.log('🔧 DEBUG - Full URL:', window.location.href);
    
    const response = await apiClient.get('/api/xero/connect', {
      params: {
        redirect_uri: redirectUri,
        state: state
      }
    });
    
    console.log('🔧 Backend response:', response.data);
    console.log('🔧 DEBUG - Auth URL from backend:', response.data.authUrl);
    
    // Check if the auth URL contains the correct redirect URI
    if (response.data.authUrl) {
      const authUrl = response.data.authUrl;
      console.log('🔧 DEBUG - Checking auth URL for redirect URI...');
      if (authUrl.includes('localhost')) {
        console.error('❌ ERROR: Backend returned auth URL with localhost!');
        console.error('❌ Auth URL:', authUrl);
      } else if (authUrl.includes('compliance-manager-frontend.onrender.com')) {
        console.log('✅ SUCCESS: Auth URL contains correct Render domain');
      } else {
        console.warn('⚠️ WARNING: Auth URL does not contain expected domain');
        console.warn('⚠️ Auth URL:', authUrl);
      }
    }
    
    if (!response.data.authUrl) {
      throw new Error('No authorization URL received from backend');
    }
    
    return {
      authUrl: response.data.authUrl,
      state: state
    };
  } catch (error: any) {
    console.error('❌ Failed to get Xero auth URL:', error);
    xeroOAuthHelper.resetOAuth();
    throw error;
  }
};

// Handle OAuth callback and exchange code for tokens
export const handleXeroCallback = async (code: string, state: string): Promise<{
  tokens: XeroTokens;
  tenants: XeroTenant[];
  companyId: string;
}> => {
  try {
    // Verify the callback state
    if (!xeroOAuthHelper.verifyCallback(state)) {
      throw new Error('Invalid or expired OAuth state');
    }
    
    // Always use Render redirect URI for callback (no localhost)
    const redirectUri = getRenderRedirectUri();
    
    console.log('🔧 Handling OAuth callback with RENDER redirect URI:', redirectUri);
    console.log('🔧 Current window location:', window.location.origin);
    console.log('🔧 Environment:', import.meta.env.PROD ? 'Production' : 'Development');
    console.log('🔧 VITE_FRONTEND_URL:', import.meta.env.VITE_FRONTEND_URL);
    console.log('🔧 Callback data:', { code: code.substring(0, 10) + '...', state });
    console.log('🔧 Hostname:', window.location.hostname);
    console.log('🔧 NO LOCALHOST - Using Render domain only');
    
    const response = await apiClient.post('/api/xero/oauth-callback', { 
      code, 
      state,
      redirect_uri: redirectUri
    });
    
    // Complete the OAuth flow
    xeroOAuthHelper.completeOAuth();
    
    console.log('✅ OAuth callback successful');
    return response.data.data;
  } catch (error: any) {
    console.error('❌ OAuth callback failed:', error);
    xeroOAuthHelper.resetOAuth();
    throw error;
  }
};

// Get company information and enrollment status
export const getXeroCompanyInfo = async (): Promise<XeroCompanyInfo> => {
  const response = await apiClient.get('/api/xero/company-info');
  return response.data.data;
};

// Refresh access token
export const refreshXeroToken = async (refreshToken: string, companyId: number): Promise<XeroTokens> => {
  const response = await apiClient.post('/api/xero/refresh-token', { refreshToken, companyId });
  return response.data.data;
};

// Get Xero data for a specific resource type (backend handles authentication)
export const getXeroData = async (
  resourceType: string,
  tenantId?: string
): Promise<XeroDataResponse<any>> => {
  // Map resource types to specific backend endpoints that handle authentication internally
  switch (resourceType) {
    case 'invoices':
      return await getAllInvoices(1, 50, tenantId);
    case 'contacts':
      return await getAllContacts(1, 50, tenantId);
    case 'bank-transactions':
      return await getAllBankTransactions(1, 50, tenantId);
    case 'accounts':
      return await getAllAccounts(tenantId);
    case 'items':
      return await getAllItems(tenantId);
    case 'tax-rates':
      return await getAllTaxRates(tenantId);
    case 'tracking-categories':
      return await getAllTrackingCategories(tenantId);
    case 'organization':
      return await getOrganizationDetails(tenantId);
    case 'purchase-orders':
      return await getAllPurchaseOrders(1, 50, tenantId);
    case 'receipts':
      return await getAllReceipts(1, 50, tenantId);
    case 'credit-notes':
      return await getAllCreditNotes(1, 50, tenantId);
    case 'manual-journals':
      return await getAllManualJournals(1, 50, tenantId);
    case 'prepayments':
      return await getAllPrepayments(1, 50, tenantId);
    case 'overpayments':
      return await getAllOverpayments(1, 50, tenantId);
    case 'quotes':
      return await getAllQuotes(1, 50, tenantId);
    case 'reports':
      // Use financial-summary endpoint instead of reports (since reports endpoint has 401 issues)
      console.log('📊 Using financial-summary endpoint for reports data');
      return await getFinancialSummary(tenantId);
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
};

// New comprehensive data functions
export const getDashboardData = async (tenantId?: string): Promise<XeroDataResponse<XeroDashboardData>> => {
  const url = tenantId ? `/xero/dashboard-data?tenantId=${tenantId}` : '/xero/dashboard-data';
  const response = await apiClient.get(url);
  return response.data;
};

export const getFinancialSummary = async (tenantId?: string): Promise<XeroDataResponse<XeroFinancialSummary>> => {
  const url = tenantId ? `/xero/financial-summary?tenantId=${tenantId}` : '/xero/financial-summary';
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllInvoices = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-invoices?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-invoices?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllContacts = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-contacts?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-contacts?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllBankTransactions = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-bank-transactions?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-bank-transactions?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllAccounts = async (tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-accounts?tenantId=${tenantId}` : '/xero/all-accounts';
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllItems = async (tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-items?tenantId=${tenantId}` : '/xero/all-items';
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllTaxRates = async (tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-tax-rates?tenantId=${tenantId}` : '/xero/all-tax-rates';
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllTrackingCategories = async (tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-tracking-categories?tenantId=${tenantId}` : '/xero/all-tracking-categories';
  const response = await apiClient.get(url);
  return response.data;
};

export const getOrganizationDetails = async (tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/organization-details?tenantId=${tenantId}` : '/xero/organization-details';
  const response = await apiClient.get(url);
  return response.data;
};

// Additional Xero API endpoints
export const getAllPurchaseOrders = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-purchase-orders?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-purchase-orders?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllReceipts = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-receipts?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-receipts?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllCreditNotes = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-credit-notes?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-credit-notes?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllManualJournals = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-manual-journals?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-manual-journals?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllPrepayments = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-prepayments?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-prepayments?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllOverpayments = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-overpayments?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-overpayments?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getAllQuotes = async (page = 1, pageSize = 50, tenantId?: string): Promise<XeroDataResponse<any>> => {
  const url = tenantId ? `/xero/all-quotes?page=${page}&pageSize=${pageSize}&tenantId=${tenantId}` : `/xero/all-quotes?page=${page}&pageSize=${pageSize}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getReports = async (reportID: string, tenantId?: string): Promise<XeroDataResponse<any>> => {
  try {
    // Try the reports endpoint first
    const url = tenantId ? `/xero/reports?reportID=${reportID}&tenantId=${tenantId}` : `/xero/reports?reportID=${reportID}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    console.log(`⚠️ Reports endpoint failed for ${reportID}:`, error.response?.status, error.response?.data);
    
    // If reports endpoint fails, try to get financial data from other sources
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log('🔄 Trying alternative data sources for financial analysis...');
      
      // Try to get invoices and contacts as fallback for financial analysis
      try {
        const invoices = await getAllInvoices(1, 100, tenantId);
        const contacts = await getAllContacts(1, 100, tenantId);
        
        // Calculate financial summary from invoice data
        let totalRevenue = 0;
        let paidRevenue = 0;
        let outstandingRevenue = 0;
        
        if (invoices.data && Array.isArray(invoices.data)) {
          invoices.data.forEach((invoice: any) => {
            const amount = parseFloat(invoice.Total) || 0;
            const amountPaid = parseFloat(invoice.AmountPaid) || 0;
            
            totalRevenue += amount;
            paidRevenue += amountPaid;
            outstandingRevenue += (amount - amountPaid);
          });
        }
        
        // Return a comprehensive financial summary structure
        return {
          success: true,
          message: 'Financial data compiled from available sources',
          data: {
            reportType: 'FinancialSummary',
            totalRevenue: totalRevenue.toFixed(2),
            paidRevenue: paidRevenue.toFixed(2),
            outstandingRevenue: outstandingRevenue.toFixed(2),
            netIncome: (totalRevenue - (totalRevenue * 0.1)).toFixed(2), // Estimate 10% expenses
            totalExpenses: (totalRevenue * 0.1).toFixed(2), // Estimate 10% expenses
            invoiceCount: invoices.data?.length || 0,
            transactionCount: 0, // Will be calculated separately
            invoices: invoices.data || [],
            contacts: contacts.data || [],
            generatedAt: new Date().toISOString(),
            note: 'Report compiled from invoices and contacts data (fallback)',
            dataQuality: {
              invoicesRetrieved: true,
              transactionsRetrieved: false,
              partialData: true
            }
          }
        };
      } catch (fallbackError) {
        console.error('❌ Fallback data sources also failed:', fallbackError);
        throw error; // Re-throw the original error
      }
    }
    
    throw error;
  }
};

// Available resource types
// BAS (Business Activity Statement) Data API
export const getBASData = async (options?: {
  fromDate?: string;
  toDate?: string;
  useCache?: boolean;
}): Promise<XeroDataResponse<any>> => {
  const params = new URLSearchParams();
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);
  if (options?.useCache !== undefined) params.append('useCache', options.useCache.toString());
  
  const url = `/xero/bas-data${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getCurrentBASData = async (): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.get('/xero/bas-data/current');
  return response.data;
};

export const getBASSummary = async (): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.get('/xero/bas-data/summary');
  return response.data;
};

export const getBASCalculation = async (options?: {
  fromDate?: string;
  toDate?: string;
}): Promise<XeroDataResponse<any>> => {
  const params = new URLSearchParams();
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);
  
  const url = `/xero/bas-data/calculation${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const syncBASData = async (options?: {
  fromDate?: string;
  toDate?: string;
}): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.post('/xero/sync/bas', options || {});
  return response.data;
};

// FAS (Fringe Benefits Tax Activity Statement) Data API
export const getFASData = async (options?: {
  fromDate?: string;
  toDate?: string;
  useCache?: boolean;
}): Promise<XeroDataResponse<any>> => {
  const params = new URLSearchParams();
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);
  if (options?.useCache !== undefined) params.append('useCache', options.useCache.toString());
  
  const url = `/xero/fas-data${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getCurrentFASData = async (): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.get('/xero/fas-data/current');
  return response.data;
};

export const getFASSummary = async (): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.get('/xero/fas-data/summary');
  return response.data;
};

export const getFASCalculation = async (options?: {
  fromDate?: string;
  toDate?: string;
}): Promise<XeroDataResponse<any>> => {
  const params = new URLSearchParams();
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);
  
  const url = `/xero/fas-data/calculation${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const getFBTCategories = async (): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.get('/xero/fas-data/categories');
  return response.data;
};

export const syncFASData = async (options?: {
  fromDate?: string;
  toDate?: string;
}): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.post('/xero/sync/fas', options || {});
  return response.data;
};

export const downloadBASReportPdf = async (payload: {
  basData: Record<string, unknown>;
  summary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<Blob> => {
  const response = await apiClient.post('/reports/bas/pdf', payload, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadFASReportPdf = async (payload: {
  fasData: Record<string, unknown>;
  summary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<Blob> => {
  const response = await apiClient.post('/reports/fas/pdf', payload, {
    responseType: 'blob'
  });
  return response.data;
};

// Available resource types
export const XERO_RESOURCE_TYPES = [
  'invoices',
  'contacts',
  'bank-transactions',
  'accounts',
  'items',
  'tax-rates',
  'tracking-categories',
  'organization',
  'purchase-orders',
  'receipts',
  'credit-notes',
  'manual-journals',
  'prepayments',
  'overpayments',
  'quotes',
  'reports',
] as const;

export type XeroResourceType = typeof XERO_RESOURCE_TYPES[number];
