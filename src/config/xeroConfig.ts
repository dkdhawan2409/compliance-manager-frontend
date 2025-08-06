// Xero OAuth2 Configuration
export const XERO_CONFIG = {
  // Xero API endpoints
  AUTH_URL: 'https://login.xero.com/identity/connect/authorize',
  TOKEN_URL: 'https://identity.xero.com/connect/token',
  
  // Scopes required for the application
  SCOPES: [
    'offline_access',
    'accounting.transactions',
    'accounting.contacts',
    'accounting.settings',
  ].join(' '),
};

// Validate configuration
export const validateXeroConfig = (): boolean => {
  // No static validation needed since each company configures their own settings
  return true;
}; 