import apiClient from './client';

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
  // Get the current domain with fallback to environment variable in production
  let currentDomain: string;
  
  if (import.meta.env.PROD) {
    // In production, prioritize environment variable
    currentDomain = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  } else {
    // In development, use window.location.origin
    currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }
  
  console.log('🔧 Generating OAuth URL with domain:', currentDomain);
  
  const response = await apiClient.get('/xero/login', {
    params: {
      redirect_uri: `${currentDomain}/redirecturl`
    }
  });
  return response.data.data;
};

// Handle OAuth callback and exchange code for tokens
export const handleXeroCallback = async (code: string, state: string): Promise<{
  tokens: XeroTokens;
  tenants: XeroTenant[];
  companyId: string;
}> => {
  // Get the current domain with fallback to environment variable in production
  let currentDomain: string;
  
  if (import.meta.env.PROD) {
    // In production, prioritize environment variable
    currentDomain = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  } else {
    // In development, use window.location.origin
    currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }
  
  console.log('🔧 Handling OAuth callback with domain:', currentDomain);
  
  const response = await apiClient.post('/xero/callback', { 
    code, 
    state,
    redirect_uri: `${currentDomain}/redirecturl`
  });
  return response.data.data;
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
      return await getReports('BalanceSheet'); // Default to Balance Sheet report
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

export const getReports = async (reportID: string): Promise<XeroDataResponse<any>> => {
  const response = await apiClient.get(`/xero/reports?reportID=${reportID}`);
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