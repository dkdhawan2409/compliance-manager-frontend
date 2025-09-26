// Xero Hook
// Custom hook for accessing Xero context with additional utilities

import { useXero as useXeroContext } from '../context/XeroProvider';
import { XeroResourceType, XeroDataRequest, XeroDataResponse } from '../types';

export const useXero = () => {
  const context = useXeroContext();
  
  // Additional utility functions
  const utils = {
    // Quick data loading functions
    loadInvoices: (tenantId?: string, page = 1, pageSize = 50) => 
      context.loadData({ resourceType: 'invoices', tenantId, page, pageSize }),
    
    loadContacts: (tenantId?: string, page = 1, pageSize = 50) => 
      context.loadData({ resourceType: 'contacts', tenantId, page, pageSize }),
    
    loadAccounts: (tenantId?: string) => 
      context.loadData({ resourceType: 'accounts', tenantId }),
    
    loadBankTransactions: (tenantId?: string, page = 1, pageSize = 50) => 
      context.loadData({ resourceType: 'bank-transactions', tenantId, page, pageSize }),
    
    loadOrganization: (tenantId?: string) => 
      context.loadData({ resourceType: 'organization', tenantId }),
    
    loadFinancialSummary: (tenantId?: string) => 
      context.loadData({ resourceType: 'financial-summary', tenantId }),
    
    loadDashboardData: (tenantId?: string) => 
      context.loadData({ resourceType: 'dashboard-data', tenantId }),

    // Status helpers
    isConnected: context.state.isConnected,
    hasTenants: context.state.tenants.length > 0,
    hasSelectedTenant: !!context.state.selectedTenant,
    isDemoMode: context.state.isDemoMode,
    
    // Quick actions
    getCurrentTenant: () => context.state.selectedTenant,
    getTenantNames: () => context.state.tenants.map(t => t.name || t.organizationName),
    getConnectionMessage: () => context.state.connectionStatus?.message,
  };

  return {
    ...context,
    utils,
  };
};
