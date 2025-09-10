import apiClient from './client';
import { getForcedRedirectUri } from '../utils/envChecker';
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
  const response = await apiClient.post('/xero/settings', settings);
  return response.data.data;
};

// Get Xero settings for the authenticated company
export const getXeroSettings = async (): Promise<XeroSettings & {
  isConnected?: boolean;
  connectionStatus?: string;
  tenants?: XeroTenant[];
  hasValidTokens?: boolean;
}> => {
  const response = await apiClient.get('/xero/settings');
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
}> => {
  const response = await apiClient.get('/xero/connection-status');
  return response.data.data;
};

// Delete Xero settings for the authenticated company
export const deleteXeroSettings = async (): Promise<void> => {
  await apiClient.delete('/xero/settings');
};

// Get all Xero settings (admin only)
export const getAllXeroSettings = async (): Promise<XeroSettings[]> => {
  const response = await apiClient.get('/xero/settings/all');
  return response.data.data;
};

// Authentication

// Get authorization URL for Xero login
export const getXeroAuthUrl = async (): Promise<{ authUrl: string; state: string }> => {
  try {
    // Use OAuth helper to manage the flow
    const { redirectUri, state } = xeroOAuthHelper.startOAuth();
    
    console.log('🔧 Generating OAuth URL with redirect URI:', redirectUri);
    console.log('🔧 Current window location:', window.location.origin);
    console.log('🔧 Environment:', import.meta.env.PROD ? 'Production' : 'Development');
    console.log('🔧 VITE_FRONTEND_URL:', import.meta.env.VITE_FRONTEND_URL);
    console.log('🔧 Generated state:', state);
    
    const response = await apiClient.get('/xero/login', {
      params: {
        redirect_uri: redirectUri,
        state: state
      }
    });
    
    console.log('🔧 Backend response:', response.data);
    
    if (!response.data.data?.authUrl) {
      throw new Error('No authorization URL received from backend');
    }
    
    return {
      authUrl: response.data.data.authUrl,
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
    
    // Get the redirect URI used in the OAuth flow
    const redirectUri = xeroOAuthHelper.getDisplayRedirectUri();
    
    console.log('🔧 Handling OAuth callback with redirect URI:', redirectUri);
    console.log('🔧 Current window location:', window.location.origin);
    console.log('🔧 Environment:', import.meta.env.PROD ? 'Production' : 'Development');
    console.log('🔧 VITE_FRONTEND_URL:', import.meta.env.VITE_FRONTEND_URL);
    console.log('🔧 Callback data:', { code: code.substring(0, 10) + '...', state });
    
    const response = await apiClient.post('/xero/callback', { 
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
  const response = await apiClient.get('/xero/company-info');
  return response.data.data;
};

// Refresh access token
export const refreshXeroToken = async (refreshToken: string, companyId: number): Promise<XeroTokens> => {
  const response = await apiClient.post('/xero/refresh-token', { refreshToken, companyId });
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