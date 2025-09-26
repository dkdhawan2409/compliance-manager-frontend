// Xero Integration Types
// Comprehensive type definitions for the plug-and-play Xero integration

export interface XeroConfig {
  clientId: string;
  clientSecret?: string; // Optional for OAuth-only mode
  redirectUri: string;
  scopes: string[];
  apiBaseUrl: string;
  autoRefreshTokens: boolean;
  enableDemoMode: boolean;
  environment?: 'sandbox' | 'production';
}

export interface XeroTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
  issuedAt?: number;
}

export interface XeroTenant {
  id: string;
  name: string;
  organizationName?: string;
  tenantName?: string;
  tenantId?: string;
  shortCode?: string;
  isDemoCompany?: boolean;
}

export interface XeroConnectionStatus {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'expired' | 'error' | 'pending';
  message: string;
  tenants?: XeroTenant[];
  hasValidTokens?: boolean;
  needsReconnection?: boolean;
  lastConnected?: string;
}

export interface XeroSettings {
  id?: number;
  companyId?: number;
  clientId: string;
  redirectUri: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface XeroApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  errorCode?: string;
  timestamp?: string;
}

export interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Contact: {
    ContactID: string;
    Name: string;
    EmailAddress?: string;
  };
  Date: string;
  DueDate: string;
  Status: string;
  LineAmountTypes: string;
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  AmountPaid?: number;
  AmountDue?: number;
}

export interface XeroLineItem {
  Description: string;
  Quantity: number;
  UnitAmount: number;
  LineAmount: number;
  AccountCode?: string;
  TaxType?: string;
}

export interface XeroContact {
  ContactID: string;
  ContactNumber?: string;
  AccountNumber?: string;
  ContactStatus: string;
  Name: string;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  BankAccountDetails?: string;
  TaxNumber?: string;
  AccountsReceivable?: {
    Outstanding: number;
    Overdue: number;
  };
  AccountsPayable?: {
    Outstanding: number;
    Overdue: number;
  };
}

export interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type: string;
  BankAccountNumber?: string;
  Status: string;
  Description?: string;
  BankAccountType?: string;
  CurrencyCode?: string;
  TaxType?: string;
  EnablePaymentsToAccount?: boolean;
  ShowInExpenseClaims?: boolean;
  Class?: string;
  SystemAccount?: string;
}

export interface XeroBankTransaction {
  BankTransactionID: string;
  BankAccount: {
    AccountID: string;
    Code: string;
    Name: string;
  };
  Date: string;
  Reference?: string;
  CurrencyCode: string;
  CurrencyRate: number;
  Status: string;
  LineAmountTypes: string;
  SubTotal: number;
  TotalTax: number;
  Total: number;
  BankTransactionType: string;
  LineItems: XeroLineItem[];
  IsReconciled?: boolean;
}

export interface XeroOrganization {
  OrganizationID: string;
  LegalName: string;
  Name: string;
  ShortCode?: string;
  Version: string;
  OrganisationEntityType: string;
  BaseCurrency: string;
  CountryCode: string;
  IsDemoCompany?: boolean;
  OrganisationStatus: string;
  RegistrationNumber?: string;
  EmployerIdentificationNumber?: string;
  TaxNumber?: string;
  FinancialYearEndDay?: number;
  FinancialYearEndMonth?: number;
  SalesTaxBasis?: string;
  SalesTaxPeriod?: string;
  DefaultSalesTax?: string;
  DefaultPurchasesTax?: string;
  PeriodLockDate?: string;
  EndOfYearLockDate?: string;
  CreatedDateUTC: string;
  Timezone: string;
  OrganisationEntityType: string;
  ShortCode?: string;
  ExternalLinks?: Array<{
    LinkType: string;
    Url: string;
  }>;
  PaymentTerms?: {
    Bills: {
      Day: number;
      Type: string;
    };
    Sales: {
      Day: number;
      Type: string;
    };
  };
}

export interface XeroFinancialSummary {
  totalRevenue: string;
  paidRevenue: string;
  outstandingRevenue: string;
  totalExpenses: string;
  netIncome: string;
  invoiceCount: number;
  transactionCount: number;
  lastUpdated?: string;
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
  recentInvoices: XeroInvoice[];
  recentContacts: XeroContact[];
  recentTransactions: XeroBankTransaction[];
  accounts: XeroAccount[];
  organization: XeroOrganization;
}

export type XeroResourceType = 
  | 'invoices'
  | 'contacts'
  | 'bank-transactions'
  | 'accounts'
  | 'items'
  | 'tax-rates'
  | 'tracking-categories'
  | 'organization'
  | 'purchase-orders'
  | 'receipts'
  | 'credit-notes'
  | 'manual-journals'
  | 'prepayments'
  | 'overpayments'
  | 'quotes'
  | 'reports'
  | 'financial-summary'
  | 'dashboard-data';

export interface XeroDataRequest {
  resourceType: XeroResourceType;
  tenantId?: string;
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  dateFrom?: string;
  dateTo?: string;
}

export interface XeroDataResponse<T = any> extends XeroApiResponse<T> {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    itemCount: number;
  };
  filters?: Record<string, any>;
}

// Context State Types
export interface XeroState {
  // Core state
  tokens: XeroTokens | null;
  tenants: XeroTenant[];
  selectedTenant: XeroTenant | null;
  settings: XeroSettings | null;
  connectionStatus: XeroConnectionStatus | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Computed
  isConnected: boolean;
  hasSettings: boolean;
  isDemoMode: boolean;
}

// Context Action Types
export type XeroAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOKENS'; payload: XeroTokens | null }
  | { type: 'SET_TENANTS'; payload: XeroTenant[] }
  | { type: 'SET_SELECTED_TENANT'; payload: XeroTenant | null }
  | { type: 'SET_SETTINGS'; payload: XeroSettings | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: XeroConnectionStatus | null }
  | { type: 'CLEAR_STATE' }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_DEMO_MODE'; payload: boolean };

// Hook Return Types
export interface XeroContextType {
  // State
  state: XeroState;
  
  // Actions
  startAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  disconnect: () => Promise<void>;
  loadSettings: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadData: <T = any>(request: XeroDataRequest) => Promise<XeroDataResponse<T>>;
  selectTenant: (tenantId: string) => void;
  clearError: () => void;
  saveSettings: (settings: Partial<XeroSettings>) => Promise<void>;
  deleteSettings: () => Promise<void>;
}

// Component Props Types
export interface XeroConnectProps {
  onSuccess?: (result: { tokens: XeroTokens; tenants: XeroTenant[] }) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface XeroDashboardProps {
  tenantId?: string;
  showSummary?: boolean;
  showRecentData?: boolean;
  className?: string;
  onDataLoad?: (data: XeroDashboardData) => void;
}

export interface XeroDataTableProps<T = any> {
  resourceType: XeroResourceType;
  tenantId?: string;
  columns?: string[];
  pageSize?: number;
  showPagination?: boolean;
  showFilters?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  onDataLoad?: (data: T[]) => void;
}

export interface XeroSettingsProps {
  onSettingsChange?: (settings: XeroSettings) => void;
  onSave?: (settings: XeroSettings) => void;
  className?: string;
  showAdvanced?: boolean;
}

export interface XeroStatusBadgeProps {
  status?: XeroConnectionStatus['connectionStatus'];
  showMessage?: boolean;
  className?: string;
  onClick?: () => void;
}

// Error Types
export interface XeroError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Event Types
export interface XeroEvent {
  type: 'connected' | 'disconnected' | 'error' | 'data_loaded' | 'token_refreshed';
  payload?: any;
  timestamp: string;
}

// Configuration Types
export interface XeroIntegrationConfig {
  apiBaseUrl: string;
  autoRefreshTokens: boolean;
  enableDemoMode: boolean;
  enableLogging: boolean;
  tokenRefreshThreshold: number; // minutes before expiry
  requestTimeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

// Factory Types
export interface XeroIntegrationFactory {
  createContext: (config: XeroConfig) => React.Context<XeroContextType>;
  createApi: (config: XeroConfig) => any;
  createComponents: (config: XeroConfig) => {
    XeroConnect: React.ComponentType<XeroConnectProps>;
    XeroDashboard: React.ComponentType<XeroDashboardProps>;
    XeroDataTable: React.ComponentType<XeroDataTableProps>;
    XeroSettings: React.ComponentType<XeroSettingsProps>;
    XeroStatusBadge: React.ComponentType<XeroStatusBadgeProps>;
  };
}
