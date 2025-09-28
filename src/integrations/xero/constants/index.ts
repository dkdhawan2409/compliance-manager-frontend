// Xero Integration Constants
// Centralized constants for the plug-and-play Xero integration

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
  'financial-summary',
  'dashboard-data',
] as const;

export const XERO_SCOPES = [
  'offline_access',
  'accounting.transactions',
  'accounting.contacts',
  'accounting.settings',
  'accounting.transactions.read',
  'accounting.contacts.read',
  'accounting.settings.read',
  'accounting.attachments',
  'accounting.attachments.read',
  'accounting.reports.read',
  'accounting.journals.read',
  'accounting.payroll.employees',
  'accounting.payroll.employees.read',
  'accounting.payroll.payruns',
  'accounting.payroll.payruns.read',
  'accounting.payroll.timesheets',
  'accounting.payroll.timesheets.read',
  'accounting.payroll.payslip',
  'accounting.payroll.payslip.read',
  'accounting.payroll.settings',
  'accounting.payroll.settings.read',
  'accounting.budgets',
  'accounting.budgets.read',
  'accounting.reports.tenninetynine',
  'accounting.reports.tenninetynine.read',
] as const;

export const XERO_ENVIRONMENTS = {
  SANDBOX: 'sandbox',
  PRODUCTION: 'production',
} as const;

export const XERO_CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  EXPIRED: 'expired',
  ERROR: 'error',
  PENDING: 'pending',
  NOT_CONFIGURED: 'not_configured',
} as const;

export const XERO_INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  AUTHORISED: 'AUTHORISED',
  PAID: 'PAID',
  VOIDED: 'VOIDED',
  DELETED: 'DELETED',
} as const;

export const XERO_CONTACT_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  GDPRREQUEST: 'GDPRREQUEST',
} as const;

export const XERO_ACCOUNT_TYPES = {
  REVENUE: 'REVENUE',
  OTHERINCOME: 'OTHERINCOME',
  COSTOFSALES: 'COSTOFSALES',
  EXPENSE: 'EXPENSE',
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  SALES: 'SALES',
  PURCHASES: 'PURCHASES',
  DIRECTCOSTS: 'DIRECTCOSTS',
  OVERHEADS: 'OVERHEADS',
  OTHEREXPENSE: 'OTHEREXPENSE',
  DEPRECIATN: 'DEPRECIATN',
  CURRENTASSET: 'CURRENTASSET',
  PREPAYMENT: 'PREPAYMENT',
  FIXEDASSET: 'FIXEDASSET',
  INVENTORYASSET: 'INVENTORYASSET',
  NONCURRENTASSET: 'NONCURRENTASSET',
  PAYGLIABILITY: 'PAYGLIABILITY',
  SUPERANNUATIONEXPENSE: 'SUPERANNUATIONEXPENSE',
  SUPERANNUATIONLIABILITY: 'SUPERANNUATIONLIABILITY',
  WAGESEXPENSE: 'WAGESEXPENSE',
  WAGESPAYABLELIABILITY: 'WAGESPAYABLELIABILITY',
  SALESTAX: 'SALESTAX',
  OTHERINCOMETAX: 'OTHERINCOMETAX',
  INCOMETAX: 'INCOMETAX',
  INTRANSITASSET: 'INTRANSITASSET',
  CURRENTLIABILITY: 'CURRENTLIABILITY',
  CREDITORS: 'CREDITORS',
  TERMLIABILITY: 'TERMLIABILITY',
  NONCURRENTLIABILITY: 'NONCURRENTLIABILITY',
  RETAINEDEARNINGS: 'RETAINEDEARNINGS',
  OWNERSEQUITY: 'OWNERSEQUITY',
} as const;

export const XERO_BANK_TRANSACTION_TYPES = {
  RECEIVE: 'RECEIVE',
  RECEIVEOVERPAYMENT: 'RECEIVEOVERPAYMENT',
  RECEIVEPREPAYMENT: 'RECEIVEPREPAYMENT',
  SPEND: 'SPEND',
  SPENDOVERPAYMENT: 'SPENDOVERPAYMENT',
  SPENDPREPAYMENT: 'SPENDPREPAYMENT',
  RECEIVETRANSFER: 'RECEIVETRANSFER',
  PAYTRANSFER: 'PAYTRANSFER',
} as const;

export const XERO_CURRENCY_CODES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD',
  'PHP', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'USD', 'ZAR',
] as const;

export const XERO_DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  US: 'MM/DD/YYYY',
} as const;

export const XERO_PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  MIN_PAGE_SIZE: 1,
} as const;

export const XERO_API_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  MAX_REQUESTS_PER_DAY: 5000,
  TOKEN_REFRESH_THRESHOLD_MINUTES: 5,
  REQUEST_TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const XERO_ERROR_CODES = {
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  INVALID_REQUEST: 'invalid_request',
  INVALID_SCOPE: 'invalid_scope',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  ACCESS_DENIED: 'access_denied',
  SERVER_ERROR: 'server_error',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
  EXPIRED_TOKEN: 'expired_token',
  INVALID_TOKEN: 'invalid_token',
  TOKEN_EXPIRED: 'token_expired',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
} as const;

export const XERO_MESSAGES = {
  CONNECT_SUCCESS: 'Successfully connected to Xero!',
  CONNECT_ERROR: 'Failed to connect to Xero. Please try again.',
  DISCONNECT_SUCCESS: 'Successfully disconnected from Xero',
  DISCONNECT_ERROR: 'Failed to disconnect from Xero',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  TOKEN_REFRESH_ERROR: 'Failed to refresh token',
  DATA_LOAD_SUCCESS: 'Data loaded successfully',
  DATA_LOAD_ERROR: 'Failed to load data',
  SETTINGS_SAVE_SUCCESS: 'Settings saved successfully',
  SETTINGS_SAVE_ERROR: 'Failed to save settings',
  SETTINGS_DELETE_SUCCESS: 'Settings deleted successfully',
  SETTINGS_DELETE_ERROR: 'Failed to delete settings',
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized access. Please log in again.',
  FORBIDDEN: 'Access forbidden. Insufficient permissions.',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  CONFIGURATION_ERROR: 'Configuration error. Please check your settings.',
} as const;

export const XERO_DEMO_DATA = {
  TENANT: {
    id: 'demo-tenant-id',
    name: 'Demo Organization',
    organizationName: 'Demo Organization Ltd',
    tenantName: 'Demo Organization',
    shortCode: 'DEMO',
    isDemoCompany: true,
  },
  INVOICES: [
    {
      InvoiceID: 'demo-invoice-1',
      InvoiceNumber: 'INV-001',
      Contact: {
        ContactID: 'demo-contact-1',
        Name: 'Demo Customer',
        EmailAddress: 'demo@customer.com',
      },
      Date: '2024-01-01',
      DueDate: '2024-01-15',
      Status: 'AUTHORISED',
      LineAmountTypes: 'Exclusive',
      LineItems: [
        {
          Description: 'Demo Product',
          Quantity: 1,
          UnitAmount: 100.00,
          LineAmount: 100.00,
        },
      ],
      SubTotal: 100.00,
      TotalTax: 10.00,
      Total: 110.00,
      AmountPaid: 0,
      AmountDue: 110.00,
    },
  ],
  CONTACTS: [
    {
      ContactID: 'demo-contact-1',
      ContactNumber: 'C-001',
      ContactStatus: 'ACTIVE',
      Name: 'Demo Customer',
      FirstName: 'Demo',
      LastName: 'Customer',
      EmailAddress: 'demo@customer.com',
      AccountsReceivable: {
        Outstanding: 110.00,
        Overdue: 0,
      },
    },
  ],
  ACCOUNTS: [
    {
      AccountID: 'demo-account-1',
      Code: '200',
      Name: 'Sales',
      Type: 'REVENUE',
      Status: 'ACTIVE',
      Description: 'Sales revenue account',
    },
  ],
} as const;

export const XERO_LOCAL_STORAGE_KEYS = {
  TOKENS: 'xero_tokens',
  TENANTS: 'xero_tenants',
  SELECTED_TENANT: 'xero_selected_tenant',
  SETTINGS: 'xero_settings',
  CONNECTION_STATUS: 'xero_connection_status',
  AUTH_START_TIME: 'xero_auth_start_time',
  AUTHORIZED: 'xero_authorized',
  AUTH_TIMESTAMP: 'xero_auth_timestamp',
  DEMO_MODE: 'xero_demo_mode',
  LAST_REFRESH: 'xero_last_refresh',
} as const;

export const XERO_API_ENDPOINTS = {
  AUTH_URL: 'https://login.xero.com/identity/connect/authorize',
  TOKEN_URL: 'https://identity.xero.com/connect/token',
  API_BASE: 'https://api.xero.com',
  ACCOUNTING_API: 'https://api.xero.com/api.xro/2.0',
  IDENTITY_API: 'https://api.xero.com/identity',
} as const;

export const XERO_VALIDATION_RULES = {
  CLIENT_ID: {
    required: true,
    pattern: /^[a-f0-9-]{36}$/i,
    message: 'Client ID must be a valid UUID format',
  },
  REDIRECT_URI: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'Redirect URI must be a valid URL starting with http:// or https://',
  },
  TENANT_ID: {
    required: true,
    pattern: /^[a-f0-9-]{36}$/i,
    message: 'Tenant ID must be a valid UUID format',
  },
} as const;

export const XERO_COMPONENT_DEFAULTS = {
  PAGE_SIZE: 50,
  AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 4000,
  MODAL_TIMEOUT: 30000,
} as const;
