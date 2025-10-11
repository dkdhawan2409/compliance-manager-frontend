import React, { ComponentType, useEffect, useState } from 'react';
import { useXero } from '../contexts/XeroContext';

// Types
interface XeroTenant {
  id: string;
  tenantId: string;
  name: string;
  tenantName: string;
  organizationName: string;
  organizationCountry?: string;
  organizationTaxNumber?: string;
  organizationLegalName?: string;
  organizationShortCode?: string;
}

interface XeroDataProps {
  // Connection status
  isConnected: boolean;
  isTokenValid: boolean;
  connectionError: string | null;
  isLoading: boolean;
  
  // Organization selection
  selectedTenant: XeroTenant | null;
  availableTenants: XeroTenant[];
  onTenantSelect: (tenant: XeroTenant | null) => void;
  
  // Data
  xeroData: {
    invoices?: any;
    contacts?: any;
    basData?: any;
    fasData?: any;
    financialSummary?: any;
    dashboardData?: any;
  };
  dataLoading: boolean;
  dataError: string | null;
  
  // Actions
  connectToXero: () => void;
  disconnectFromXero: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  loadXeroData: (type: string, options?: any) => Promise<any>;
  clearCache: () => Promise<void>;
}

// HOC function
export function withXeroData<P extends object>(
  WrappedComponent: ComponentType<P & XeroDataProps>
): ComponentType<P> {
  const WithXeroDataComponent = (props: P) => {
    const {
      status,
      isLoading,
      error,
      selectedTenant,
      availableTenants,
      data,
      dataLoading,
      dataError,
      checkConnection,
      connect,
      disconnect,
      selectTenant,
      loadData,
      refreshData,
      clearCache
    } = useXero();

    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize on mount
    useEffect(() => {
      if (!isInitialized) {
        setIsInitialized(true);
        // Connection status is automatically checked by the context
        console.log('🔧 Xero HOC initialized');
      }
    }, [isInitialized]);

    // Auto-select first tenant if none selected
    useEffect(() => {
      if (availableTenants.length > 0 && !selectedTenant && status.connected) {
        console.log('🏢 Auto-selecting first available tenant');
        selectTenant(availableTenants[0]);
      }
    }, [availableTenants, selectedTenant, status.connected, selectTenant]);

    // Enhanced data loading with tenant validation
    const loadXeroData = async (type: string, options: any = {}) => {
      try {
        // Validate connection
        if (!status.connected || !status.isTokenValid) {
          throw new Error('Not connected to Xero or token expired. Please reconnect.');
        }

        // Validate tenant selection
        if (!selectedTenant) {
          throw new Error('No organization selected. Please select an organization first.');
        }

        console.log(`📊 Loading ${type} data for organization: ${selectedTenant.name}`);

        // Load data with tenant ID
        const result = await loadData(type as any, {
          ...options,
          tenantId: selectedTenant.tenantId || selectedTenant.id
        });

        return result;
      } catch (error: any) {
        console.error(`❌ Error loading ${type} data:`, error);
        throw error;
      }
    };

    // Enhanced connection refresh
    const refreshConnection = async () => {
      try {
        console.log('🔄 Refreshing Xero connection...');
        await checkConnection();
        console.log('✅ Connection refreshed successfully');
      } catch (error: any) {
        console.error('❌ Error refreshing connection:', error);
        throw error;
      }
    };

    // Enhanced disconnect
    const disconnectFromXero = async () => {
      try {
        console.log('🔌 Disconnecting from Xero...');
        await disconnect();
        console.log('✅ Disconnected from Xero successfully');
      } catch (error: any) {
        console.error('❌ Error disconnecting:', error);
        throw error;
      }
    };

    // Enhanced cache clearing
    const clearXeroCache = async () => {
      try {
        console.log('🗑️ Clearing Xero cache...');
        await clearCache();
        console.log('✅ Cache cleared successfully');
      } catch (error: any) {
        console.error('❌ Error clearing cache:', error);
        throw error;
      }
    };

    // Prepare props for wrapped component
    const xeroProps: XeroDataProps = {
      // Connection status
      isConnected: status.connected,
      isTokenValid: status.isTokenValid,
      connectionError: error,
      isLoading,
      
      // Organization selection
      selectedTenant,
      availableTenants,
      onTenantSelect: selectTenant,
      
      // Data
      xeroData: data,
      dataLoading,
      dataError,
      
      // Actions
      connectToXero: connect,
      disconnectFromXero,
      refreshConnection,
      loadXeroData,
      clearCache: clearXeroCache
    };

    return <WrappedComponent {...props} {...xeroProps} />;
  };

  // Set display name for debugging
  WithXeroDataComponent.displayName = `withXeroData(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithXeroDataComponent;
}

// Export types for use in components
export type { XeroDataProps, XeroTenant };