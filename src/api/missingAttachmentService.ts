import apiClient from './client';

export interface MissingAttachmentConfig {
  id?: number;
  companyId: number;
  gstThreshold: number;
  enabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  phoneNumber?: string;
  emailAddress?: string;
  linkExpiryDays: number;
  maxDailyNotifications: number;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  lastProcessedAt?: string;
  totalNotificationsSent: number;
  totalTransactionsProcessed: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadLink {
  id: number;
  linkId: string;
  transactionId: string;
  companyId: number;
  tenantId: string;
  transactionType: 'Invoice' | 'BankTransaction' | 'Receipt' | 'PurchaseOrder';
  phoneNumber?: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  smsSid?: string;
  smsStatus?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissingTransaction {
  InvoiceID?: string;
  BankTransactionID?: string;
  ReceiptID?: string;
  PurchaseOrderID?: string;
  type: string;
  Total: string;
  TotalTax?: string;
  SubTotal?: string;
  CurrencyCode?: string;
  HasAttachments: boolean;
  Date?: string;
  Contact?: any;
  moneyAtRisk: {
    total: number;
    totalTax: number;
    subTotal: number;
    threshold: number;
    exceedsThreshold: boolean;
    riskLevel: 'HIGH' | 'LOW';
    potentialPenalty: number;
    currency: string;
  };
}

export interface MissingAttachmentsResponse {
  totalTransactions: number;
  highRiskCount: number;
  lowRiskCount: number;
  transactions: MissingTransaction[];
}

export interface ProcessingResult {
  companyId: string;
  totalTransactions: number;
  highRiskCount: number;
  lowRiskCount: number;
  smssSent: number;
  errors: Array<{
    transactionId: string;
    error: string;
  }>;
  processedAt: string;
}

export interface Statistics {
  period: string;
  totalLinks: number;
  usedLinks: number;
  expiredLinks: number;
  activeLinks: number;
  conversionRate: string;
  totalNotificationsSent: number;
  totalTransactionsProcessed: number;
}

export interface TokenStatus {
  status: 'healthy' | 'notice' | 'warning' | 'expired' | 'no_tokens' | 'error' | 'access_expired';
  message: string;
  daysUntilExpiry: number | null;
  refreshTokenAgeDays: number | null;
  accessTokenExpired: boolean;
  needsReconnection: boolean;
}

export interface UploadLinksResponse {
  links: UploadLink[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Configuration Management
export const getMissingAttachmentConfig = async (): Promise<MissingAttachmentConfig> => {
  const response = await apiClient.get('/missing-attachments/config');
  return response.data.data;
};

export const updateMissingAttachmentConfig = async (
  config: Partial<MissingAttachmentConfig>
): Promise<MissingAttachmentConfig> => {
  const response = await apiClient.put('/missing-attachments/config', config);
  return response.data.data;
};

// Detection and Processing
export const detectMissingAttachments = async (
  tenantId?: string
): Promise<MissingAttachmentsResponse> => {
  const params = tenantId ? { tenantId } : {};
  const response = await apiClient.get('/missing-attachments/detect', { params });
  return response.data.data;
};

export const processMissingAttachments = async (): Promise<ProcessingResult> => {
  const response = await apiClient.post('/missing-attachments/process');
  return response.data.data;
};

// Upload Link Management
export const getUploadLinks = async (
  page = 1,
  limit = 20,
  status: 'all' | 'active' | 'used' | 'expired' = 'all'
): Promise<UploadLinksResponse> => {
  const response = await apiClient.get('/missing-attachments/upload-links', {
    params: { page, limit, status }
  });
  return response.data.data;
};

export const createUploadLink = async (params: {
  transactionId: string;
  tenantId: string;
  transactionType: string;
}): Promise<UploadLink> => {
  const response = await apiClient.post('/missing-attachments/upload-links', params);
  return response.data.data;
};

// Statistics
export const getMissingAttachmentStatistics = async (
  days = 30
): Promise<Statistics> => {
  const response = await apiClient.get('/missing-attachments/statistics', {
    params: { days }
  });
  return response.data.data;
};

// Public Upload Functions (no authentication required)
export const getUploadPageData = async (
  linkId: string,
  token: string
): Promise<{
  linkId: string;
  transactionId: string;
  transactionType: string;
  companyName: string;
  expiresAt: string;
  allowedFileTypes: string[];
  maxFileSize: string;
}> => {
  const response = await apiClient.get(`/missing-attachments/upload/${linkId}?token=${token}`);
  return response.data.data;
};

export const uploadReceipt = async (
  linkId: string,
  token: string,
  file: File
): Promise<{
  success: boolean;
  message: string;
  fileUrl?: string;
}> => {
  const formData = new FormData();
  formData.append('receipt', file);
  formData.append('token', token);

  const response = await apiClient.post(`/missing-attachments/upload/${linkId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data;
};

// Cleanup and Maintenance
export const cleanupExpiredLinks = async (days = 30): Promise<{
  deletedCount: number;
  cutoffDate: string;
  daysOld: number;
}> => {
  const response = await apiClient.delete('/missing-attachments/cleanup', {
    params: { days }
  });
  return response.data.data;
};

export const getDuplicateStats = async (): Promise<{
  duplicateTransactions: Array<{
    transaction_id: string;
    link_count: string;
    latest_created: string;
    first_created: string;
  }>;
  totalDuplicates: number;
  companyId: number;
}> => {
  const response = await apiClient.get('/missing-attachments/duplicates');
  return response.data.data;
};

export const checkTokenStatus = async (): Promise<TokenStatus> => {
  const response = await apiClient.get('/missing-attachments/token-status');
  return response.data.data;
};
