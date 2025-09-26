// Xero Integration Factory
// Factory function for creating customizable Xero integrations

import React from 'react';
import { XeroConfig, XeroIntegrationFactory, XeroIntegrationConfig } from '../types';
import { XeroProvider } from '../context/XeroProvider';
import { createXeroApi } from '../api/xeroApi';
import { XeroConnect } from '../components/XeroConnect';
import { XeroDashboard } from '../components/XeroDashboard';
import { XeroDataTable } from '../components/XeroDataTable';
import { XeroSettings } from '../components/XeroSettings';
import { XeroStatusBadge } from '../components/XeroStatusBadge';

export const createXeroIntegration = (config: XeroConfig): XeroIntegrationFactory => {
  // Create API client
  const apiClient = createXeroApi(config);

  // Create context with custom config
  const createContext = (customConfig: XeroConfig) => {
    const mergedConfig = { ...config, ...customConfig };
    
    return React.createContext({
      config: mergedConfig,
      apiClient: createXeroApi(mergedConfig),
    });
  };

  // Create API with custom config
  const createApi = (customConfig: XeroConfig) => {
    const mergedConfig = { ...config, ...customConfig };
    return createXeroApi(mergedConfig);
  };

  // Create components with custom config
  const createComponents = (customConfig: XeroConfig) => {
    const mergedConfig = { ...config, ...customConfig };
    
    const CustomXeroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <XeroProvider config={mergedConfig}>
        {children}
      </XeroProvider>
    );

    const CustomXeroConnect: React.FC<any> = (props) => (
      <XeroProvider config={mergedConfig}>
        <XeroConnect {...props} />
      </XeroProvider>
    );

    const CustomXeroDashboard: React.FC<any> = (props) => (
      <XeroProvider config={mergedConfig}>
        <XeroDashboard {...props} />
      </XeroProvider>
    );

    const CustomXeroDataTable: React.FC<any> = (props) => (
      <XeroProvider config={mergedConfig}>
        <XeroDataTable {...props} />
      </XeroProvider>
    );

    const CustomXeroSettings: React.FC<any> = (props) => (
      <XeroProvider config={mergedConfig}>
        <XeroSettings {...props} />
      </XeroProvider>
    );

    const CustomXeroStatusBadge: React.FC<any> = (props) => (
      <XeroProvider config={mergedConfig}>
        <XeroStatusBadge {...props} />
      </XeroProvider>
    );

    return {
      XeroProvider: CustomXeroProvider,
      XeroConnect: CustomXeroConnect,
      XeroDashboard: CustomXeroDashboard,
      XeroDataTable: CustomXeroDataTable,
      XeroSettings: CustomXeroSettings,
      XeroStatusBadge: CustomXeroStatusBadge,
    };
  };

  return {
    createContext,
    createApi,
    createComponents,
  };
};

// Default integration factory
export const defaultXeroIntegration = createXeroIntegration({
  clientId: '',
  redirectUri: '',
  scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings'],
  apiBaseUrl: '/api/xero',
  autoRefreshTokens: true,
  enableDemoMode: false,
});

// Pre-configured integrations for common scenarios
export const createSandboxXeroIntegration = (clientId: string, redirectUri: string) => {
  return createXeroIntegration({
    clientId,
    redirectUri,
    scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings'],
    apiBaseUrl: '/api/xero',
    autoRefreshTokens: true,
    enableDemoMode: true,
    environment: 'sandbox',
  });
};

export const createProductionXeroIntegration = (clientId: string, redirectUri: string) => {
  return createXeroIntegration({
    clientId,
    redirectUri,
    scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts', 'accounting.settings'],
    apiBaseUrl: '/api/xero',
    autoRefreshTokens: true,
    enableDemoMode: false,
    environment: 'production',
  });
};

export const createMinimalXeroIntegration = (clientId: string, redirectUri: string) => {
  return createXeroIntegration({
    clientId,
    redirectUri,
    scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
    apiBaseUrl: '/api/xero',
    autoRefreshTokens: false,
    enableDemoMode: false,
  });
};

export const createFullAccessXeroIntegration = (clientId: string, redirectUri: string) => {
  return createXeroIntegration({
    clientId,
    redirectUri,
    scopes: [
      'offline_access',
      'accounting.transactions',
      'accounting.contacts',
      'accounting.settings',
      'accounting.attachments',
      'accounting.reports.read',
      'accounting.journals.read',
      'accounting.payroll.employees',
      'accounting.payroll.payruns',
      'accounting.payroll.timesheets',
      'accounting.payroll.payslip',
      'accounting.payroll.settings',
      'accounting.budgets',
      'accounting.reports.tenninetynine',
    ],
    apiBaseUrl: '/api/xero',
    autoRefreshTokens: true,
    enableDemoMode: false,
  });
};
