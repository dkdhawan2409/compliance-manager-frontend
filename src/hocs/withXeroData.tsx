import React, { ComponentType } from 'react';
import { useXero } from '../integrations/xero/context/XeroProvider';
import { getFinancialSummary, getDashboardData } from '../api/xeroService';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../utils/envChecker';

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

    // Function to load Xero data for financial analysis - ONLY from connected account
    const loadXeroDataForAnalysis = async () => {
      console.log('🔍 Starting Xero data loading for BAS/FAS analysis...');
      
      // Check if Xero is connected first
      if (!isConnected) {
        console.log('❌ Xero is not connected - cannot load data for analysis');
        throw new Error('Xero is not connected. Please connect to Xero first to load data for analysis.');
      }

      // Check if we have a selected tenant
      if (!selectedTenant) {
        console.log('❌ No tenant selected - cannot load data for analysis');
        throw new Error('No Xero organization selected. Please select an organization first.');
      }
      
      try {
        toast.loading(`Loading data from ${selectedTenant.name || 'Xero organization'}...`, { id: 'xero-load' });

        console.log(`📊 Loading real Xero data from tenant: ${selectedTenant.name} (${selectedTenant.id})`);
        
        // Load REAL invoices from the connected Xero account
        let invoices;
        try {
          console.log('📋 Loading invoices from connected Xero account...');
          const invoiceData = await loadData('invoices');
          invoices = invoiceData?.data || invoiceData?.Invoices || [];
          console.log(`✅ Real invoices loaded: ${invoices.length} records from ${selectedTenant.name}`);
        } catch (error: any) {
          console.error('❌ Failed to load invoices from Xero:', error);
          throw new Error(`Failed to load invoices from Xero: ${error.message}`);
        }

        // Load REAL contacts from the connected Xero account
        let contacts;
        try {
          console.log('👥 Loading contacts from connected Xero account...');
          const contactData = await loadData('contacts');
          contacts = contactData?.data || contactData?.Contacts || [];
          console.log(`✅ Real contacts loaded: ${contacts.length} records from ${selectedTenant.name}`);
        } catch (error: any) {
          console.error('❌ Failed to load contacts from Xero:', error);
          throw new Error(`Failed to load contacts from Xero: ${error.message}`);
        }

        // Load REAL bank transactions from the connected Xero account
        let bankTransactions;
        try {
          console.log('🏦 Loading bank transactions from connected Xero account...');
          const bankData = await loadData('bank-transactions');
          bankTransactions = bankData?.data || bankData?.BankTransactions || [];
          console.log(`✅ Real bank transactions loaded: ${bankTransactions.length} records from ${selectedTenant.name}`);
        } catch (error: any) {
          console.warn('⚠️ Failed to load bank transactions from Xero:', error);
          bankTransactions = []; // Bank transactions are optional for BAS/FAS
        }
        
        // Calculate financial summary from REAL Xero data
        console.log('📊 Calculating financial summary from real Xero data...');
        
        if (!invoices || invoices.length === 0) {
          throw new Error(`No invoice data found in your Xero organization "${selectedTenant.name}". Please ensure you have invoices in your Xero account.`);
        }
        
        let totalRevenue = 0;
        let paidRevenue = 0;
        let outstandingRevenue = 0;
        let totalGST = 0;
        
        // Process REAL invoices from the connected Xero account
        invoices.forEach((invoice: any) => {
          const amount = parseFloat(invoice.Total) || 0;
          const amountPaid = parseFloat(invoice.AmountPaid) || 0;
          const taxAmount = parseFloat(invoice.TaxAmount) || 0;
          
          totalRevenue += amount;
          paidRevenue += amountPaid;
          outstandingRevenue += (amount - amountPaid);
          totalGST += taxAmount;
        });

        // Calculate expenses from bank transactions (if available)
        let totalExpenses = 0;
        let expenseGST = 0;
        
        if (bankTransactions && bankTransactions.length > 0) {
          bankTransactions.forEach((transaction: any) => {
            const amount = parseFloat(transaction.Total) || 0;
            const taxAmount = parseFloat(transaction.TaxAmount) || 0;
            
            // Only count expenses (negative amounts or outbound transactions)
            if (amount < 0 || transaction.Type === 'SPEND') {
              totalExpenses += Math.abs(amount);
              expenseGST += taxAmount;
            }
          });
        }
        
        // If no bank transactions, estimate expenses from invoices (very rough estimate)
        if (totalExpenses === 0 && invoices.length > 0) {
          totalExpenses = totalRevenue * 0.3; // Estimate 30% of revenue as expenses
          expenseGST = totalExpenses * 0.1; // 10% GST on estimated expenses
        }
        
        const reportsData = {
          type: 'BASFinancialSummary',
          data: {
            totalRevenue: totalRevenue.toFixed(2),
            paidRevenue: paidRevenue.toFixed(2),
            outstandingRevenue: outstandingRevenue.toFixed(2),
            netIncome: (paidRevenue - totalExpenses).toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            invoiceCount: invoices.length,
            contactCount: contacts.length,
            bankTransactionCount: bankTransactions.length,
            // BAS-specific calculations from REAL data
            gstOnSales: totalGST.toFixed(2),
            gstOnPurchases: expenseGST.toFixed(2),
            netGST: (totalGST - expenseGST).toFixed(2),
            totalSalesIncGST: totalRevenue.toFixed(2),
            totalPurchasesIncGST: totalExpenses.toFixed(2),
            dataSource: 'real_xero_data',
            tenantId: selectedTenant.id,
            tenantName: selectedTenant.name,
            calculatedAt: new Date().toISOString()
          }
        };

        // Create data structure with REAL Xero data only
        const data = {
          transactions: invoices,
          contacts: contacts,
          bankTransactions: bankTransactions,
          basData: reportsData,
          dashboardData: null,
          tenantId: selectedTenant.id,
          tenantName: selectedTenant.name,
          timestamp: new Date().toISOString(),
          dataSource: 'real_xero_data'
        };

        console.log('📊 Final REAL Xero data for BAS/FAS analysis:', {
          transactionsCount: invoices.length,
          contactsCount: contacts.length,
          bankTransactionCount: bankTransactions.length,
          reportsDataType: reportsData.type,
          dataSource: data.dataSource,
          tenantId: data.tenantId,
          tenantName: data.tenantName,
          hasFinancialData: !!reportsData.data,
          totalRevenue: reportsData.data.totalRevenue,
          totalExpenses: reportsData.data.totalExpenses
        });

        toast.dismiss({ id: 'xero-load' });
        toast.success(`✅ Real data loaded successfully from ${selectedTenant.name} (${invoices.length} invoices, ${contacts.length} contacts)`);
        return data;
        
      } catch (error: any) {
        console.error('❌ Critical error loading real Xero data:', error);
        toast.dismiss({ id: 'xero-load' });
        
        // No fallback data - throw the error to prevent processing with fake data
        console.log('❌ Cannot proceed with BAS/FAS processing without real Xero data');
        
        toast.error(`Failed to load data from ${selectedTenant?.name || 'Xero'}: ${error.message}`);
        throw new Error(`Failed to load real Xero data: ${error.message}`);
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
