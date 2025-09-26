// Xero Integration - Plug and Play Package
// This is a complete, self-contained Xero integration that can be easily integrated into any React project

export { XeroProvider } from './context/XeroProvider';
export { useXero } from './hooks/useXero';
export { XeroConnect } from './components/XeroConnect';
export { XeroDashboard } from './components/XeroDashboard';
export { XeroDataTable } from './components/XeroDataTable';
export { XeroSettings } from './components/XeroSettings';
export { XeroStatusBadge } from './components/XeroStatusBadge';

export type {
  XeroConfig,
  XeroTokens,
  XeroTenant,
  XeroConnectionStatus,
  XeroResourceType,
  XeroApiResponse,
  XeroSettings as XeroSettingsType,
} from './types';

export { XERO_RESOURCE_TYPES } from './constants';
export { xeroApi } from './api/xeroApi';
export { createXeroIntegration } from './factory/createIntegration';

// Default configuration
export const defaultXeroConfig = {
  clientId: '',
  clientSecret: '',
  redirectUri: '',
  scopes: [
    'offline_access',
    'accounting.transactions',
    'accounting.contacts',
    'accounting.settings',
  ],
  apiBaseUrl: '/api/xero',
  autoRefreshTokens: true,
  enableDemoMode: false,
};
