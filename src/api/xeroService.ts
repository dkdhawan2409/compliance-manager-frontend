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

export interface XeroDataResponse {
  success: boolean;
  message: string;
  data: any;
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
export const getXeroSettings = async (): Promise<XeroSettings> => {
  const response = await apiClient.get('/xero/settings');
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
  const response = await apiClient.get('/xero/login');
  return response.data.data;
};

// Handle OAuth callback and exchange code for tokens
export const handleXeroCallback = async (code: string, state: string): Promise<{
  tokens: XeroTokens;
  tenants: XeroTenant[];
  companyId: string;
}> => {
  const response = await apiClient.post('/xero/callback', { code, state });
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

// Get Xero data for a specific resource type
export const getXeroData = async (
  resourceType: string,
  accessToken: string,
  tenantId: string
): Promise<XeroDataResponse> => {
  const response = await apiClient.post(`/xero/data/${resourceType}`, {
    accessToken,
    tenantId,
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
] as const;

export type XeroResourceType = typeof XERO_RESOURCE_TYPES[number]; 