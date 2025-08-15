import React, { ComponentType } from 'react';
import { useXero } from '../contexts/XeroContext';
import { getFinancialSummary, getDashboardData } from '../api/xeroService';
import { toast } from 'react-hot-toast';

// Interface for the props that the HOC will inject
export interface WithXeroDataProps {
  xeroData: {
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    selectedTenant: any;
    tenants: any[];
    hasSettings: boolean;
  };
  xeroActions: {
    loadData: (resourceType: string) => Promise<any>;
    selectTenant: (tenantId: string) => void;
    loadSettings: () => Promise<void>;
    startAuth: () => Promise<void>;
    disconnect: () => Promise<void>;
    refreshConnection: () => Promise<void>;
  };
  loadXeroDataForAnalysis: () => Promise<any>;
}

// HOC function
export function withXeroData<T extends WithXeroDataProps>(
  WrappedComponent: ComponentType<T>
): ComponentType<Omit<T, keyof WithXeroDataProps>> {
  
  const WithXeroDataComponent = (props: Omit<T, keyof WithXeroDataProps>) => {
    const {
      state,
      loadData,
      selectTenant,
      loadSettings,
      startAuth,
      disconnect,
      refreshConnection,
    } = useXero();

    const {
      isConnected,
      isLoading,
      error,
      selectedTenant,
      tenants,
      hasSettings,
    } = state;

    // Function to load Xero data for financial analysis (same as in AiChat)
    const loadXeroDataForAnalysis = async () => {
      if (!isConnected) {
        toast.error('Please connect to Xero first');
        return null;
      }

      if (!selectedTenant) {
        toast.error('Please select an organization first');
        return null;
      }

      try {
        toast.loading('Loading Xero data for analysis...');

        console.log('🔍 Starting Xero data loading for financial analysis...');
        console.log('  - Xero Connected:', isConnected);
        console.log('  - Selected Tenant:', selectedTenant);
        console.log('  - Tenant ID:', selectedTenant.id);
        console.log('  - Tenant Name:', selectedTenant.name);
        
        // Validate tenant ID format
        if (!selectedTenant.id || typeof selectedTenant.id !== 'string') {
          throw new Error('Invalid tenant ID format');
        }

        // Load data using the exact same pattern as XeroIntegration
        const transactions = await loadData('invoices');
        console.log('✅ Invoices loaded:', transactions?.data?.length || 0, 'records');
        console.log('📄 Full transactions response:', transactions);
        console.log('📄 Sample invoice data:', transactions?.data?.[0]);
        console.log('📄 Invoice Total field:', transactions?.data?.[0]?.Total);
        console.log('📄 Invoice AmountPaid field:', transactions?.data?.[0]?.AmountPaid);
        
        const contacts = await loadData('contacts');
        console.log('✅ Contacts loaded:', contacts?.data?.length || 0, 'records');
        console.log('👥 Full contacts response:', contacts);
        console.log('👥 Sample contact data:', contacts?.data?.[0]);
        
        // Load financial summary data using the working endpoint
        let reportsData = null;
        try {
          console.log('📊 Loading financial summary data...');
          const financialSummary = await getFinancialSummary(selectedTenant.id);
          console.log('📊 Raw financial summary response:', financialSummary);
          if (financialSummary?.data) {
            reportsData = {
              type: 'FinancialSummary',
              data: financialSummary.data
            };
            console.log('✅ Financial summary loaded successfully:', financialSummary.data);
            console.log('💰 Total Revenue from API:', financialSummary.data.totalRevenue);
            console.log('💳 Paid Revenue from API:', financialSummary.data.paidRevenue);
            console.log('📊 Outstanding Revenue from API:', financialSummary.data.outstandingRevenue);
            console.log('💵 Net Income from API:', financialSummary.data.netIncome);
            console.log('📈 Total Expenses from API:', financialSummary.data.totalExpenses);
            console.log('📊 Invoice Count:', financialSummary.data.invoiceCount);
            console.log('💳 Transaction Count:', financialSummary.data.transactionCount);
          }
        } catch (error: any) {
          console.log('⚠️ Financial summary not available:', error.message || error);
          console.log('🔍 Error details:', error);
          
          // Fallback: Calculate financial summary from invoice data
          console.log('🔄 Calculating financial summary from invoice data as fallback...');
          if (transactions?.data && Array.isArray(transactions.data)) {
            let totalRevenue = 0;
            let paidRevenue = 0;
            let outstandingRevenue = 0;
            
            transactions.data.forEach((invoice: any) => {
              const amount = parseFloat(invoice.Total) || 0;
              const amountPaid = parseFloat(invoice.AmountPaid) || 0;
              
              totalRevenue += amount;
              paidRevenue += amountPaid;
              outstandingRevenue += (amount - amountPaid);
            });
            
            reportsData = {
              type: 'FinancialSummary',
              data: {
                totalRevenue: totalRevenue.toFixed(2),
                paidRevenue: paidRevenue.toFixed(2),
                outstandingRevenue: outstandingRevenue.toFixed(2),
                netIncome: (paidRevenue * 0.9).toFixed(2), // Estimate 90% of paid revenue as net income
                totalExpenses: (paidRevenue * 0.1).toFixed(2), // Estimate 10% as expenses
                invoiceCount: transactions.data.length,
                transactionCount: 0,
                dataQuality: {
                  invoicesRetrieved: true,
                  transactionsRetrieved: false,
                  partialData: true
                }
              }
            };
            console.log('✅ Fallback financial summary calculated:', reportsData.data);
          }
        }

        // Load dashboard data for additional insights
        let dashboardData = null;
        try {
          console.log('📈 Loading dashboard data...');
          const dashboard = await getDashboardData(selectedTenant.id);
          console.log('📈 Dashboard data response:', dashboard);
          if (dashboard?.data) {
            dashboardData = dashboard.data;
            console.log('✅ Dashboard data loaded successfully');
          }
        } catch (error: any) {
          console.log('⚠️ Dashboard data not available:', error.message || error);
        }

        // Validate that we have at least some data
        if (!transactions?.data || transactions.data.length === 0) {
          console.warn('⚠️ No transaction data available');
        }
        
        if (!contacts?.data || contacts.data.length === 0) {
          console.warn('⚠️ No contact data available');
        }
        
        const data = {
          transactions: transactions?.data || [],
          contacts: contacts?.data || [],
          basData: reportsData,
          dashboardData: dashboardData,
          tenantId: selectedTenant.id,
          tenantName: selectedTenant.name,
          timestamp: new Date().toISOString()
        };

        console.log('📊 Final Xero data for analysis:', {
          transactionsCount: transactions?.data?.length || 0,
          contactsCount: contacts?.data?.length || 0,
          reportsData: reportsData ? `${reportsData.type} (${Object.keys(reportsData.data).length} fields)` : 'None',
          dashboardData: dashboardData ? 'Available' : 'None',
          tenantId: selectedTenant.id,
          tenantName: selectedTenant.name
        });

        toast.dismiss();
        toast.success('Xero data loaded successfully');
        return data;
      } catch (error: any) {
        console.error('❌ Failed to load Xero data:', error);
        toast.dismiss();
        
        // Handle specific error types
        let errorMessage = 'Failed to load Xero data';
        
        if (error.response?.status === 400) {
          errorMessage = 'Invalid request. Please check your Xero connection and try again.';
          console.log('🔍 400 Error Details:', error.response?.data);
        } else if (error.response?.status === 401) {
          errorMessage = 'Xero authorization expired. Please reconnect to continue.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Xero data not found. Please check your organization settings.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        return null;
      }
    };

    // Prepare the props to pass to the wrapped component
    const xeroProps: WithXeroDataProps = {
      xeroData: {
        isConnected,
        isLoading,
        error,
        selectedTenant,
        tenants,
        hasSettings,
      },
      xeroActions: {
        loadData,
        selectTenant,
        loadSettings,
        startAuth,
        disconnect,
        refreshConnection,
      },
      loadXeroDataForAnalysis,
    };

    // Combine the original props with the Xero props
    const combinedProps = { ...props, ...xeroProps } as T;

    return <WrappedComponent {...combinedProps} />;
  };

  // Set display name for debugging
  WithXeroDataComponent.displayName = `withXeroData(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithXeroDataComponent;
}
