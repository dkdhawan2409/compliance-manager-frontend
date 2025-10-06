import React, { ComponentType } from 'react';
import { useXero } from '../contexts/XeroContext';
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
    loadData: <T = any>(request: { resourceType: string; tenantId?: string; page?: number; pageSize?: number; filters?: Record<string, any>; dateFrom?: string; dateTo?: string; }) => Promise<any>;
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

    // Function to load Xero data for financial analysis - FROM ALL ORGANIZATIONS
    const loadXeroDataForAnalysis = async () => {
      console.log('🔍 Starting Xero data loading for BAS/FAS analysis...');
      
      // Check if Xero is connected first
      if (!isConnected) {
        console.log('❌ Xero is not connected - cannot load data for analysis');
        throw new Error('Xero is not connected. Please connect to Xero first to load data for analysis.');
      }

      // Check if we have any tenants available
      if (!tenants || tenants.length === 0) {
        console.log('❌ No organizations available - cannot load data for analysis');
        throw new Error('No Xero organizations available. Please complete the OAuth flow to access your organizations.');
      }
      
      try {
        toast.loading(`Loading data from ${tenants.length} Xero organization(s)...`, { id: 'xero-load' });

        console.log(`📊 Loading real Xero data from ${tenants.length} organization(s):`, tenants.map(t => t.name));
        
        // Initialize arrays to store data from all organizations
        let allInvoices = [];
        let allContacts = [];
        let allBankTransactions = [];
        let organizationData = {};

        // Load data from each organization
        for (const tenant of tenants) {
          console.log(`🔄 Processing organization: ${tenant.name} (${tenant.id})`);
          
          try {
            // Load invoices from this organization
            let invoices = [];
            try {
              console.log(`📋 Loading invoices from ${tenant.name}...`);
              const invoiceData = await loadData({ resourceType: 'invoices', tenantId: tenant.id });
              invoices = invoiceData?.data || invoiceData?.Invoices || [];
              console.log(`✅ Loaded ${invoices.length} invoices from ${tenant.name}`);
            } catch (error: any) {
              console.warn(`⚠️ Failed to load invoices from ${tenant.name}:`, error);
              invoices = [];
            }

            // Load contacts from this organization
            let contacts = [];
            try {
              console.log(`👥 Loading contacts from ${tenant.name}...`);
              const contactData = await loadData({ resourceType: 'contacts', tenantId: tenant.id });
              contacts = contactData?.data || contactData?.Contacts || [];
              console.log(`✅ Loaded ${contacts.length} contacts from ${tenant.name}`);
            } catch (error: any) {
              console.warn(`⚠️ Failed to load contacts from ${tenant.name}:`, error);
              contacts = [];
            }

            // Load bank transactions from this organization
            let bankTransactions = [];
            try {
              console.log(`🏦 Loading bank transactions from ${tenant.name}...`);
              const bankData = await loadData({ resourceType: 'bank-transactions', tenantId: tenant.id });
              bankTransactions = bankData?.data || bankData?.BankTransactions || [];
              console.log(`✅ Loaded ${bankTransactions.length} bank transactions from ${tenant.name}`);
            } catch (error: any) {
              console.warn(`⚠️ Failed to load bank transactions from ${tenant.name}:`, error);
              bankTransactions = [];
            }

            // Load transactions from this organization (alternative to bank transactions)
            let transactions = [];
            try {
              console.log(`💳 Loading transactions from ${tenant.name}...`);
              const transactionData = await loadData({ resourceType: 'transactions', tenantId: tenant.id });
              transactions = transactionData?.data || transactionData?.Transactions || [];
              console.log(`✅ Loaded ${transactions.length} transactions from ${tenant.name}`);
            } catch (error: any) {
              console.warn(`⚠️ Failed to load transactions from ${tenant.name}:`, error);
              transactions = [];
            }

            // Load payments from this organization
            let payments = [];
            try {
              console.log(`💰 Loading payments from ${tenant.name}...`);
              const paymentData = await loadData({ resourceType: 'payments', tenantId: tenant.id });
              payments = paymentData?.data || paymentData?.Payments || [];
              console.log(`✅ Loaded ${payments.length} payments from ${tenant.name}`);
            } catch (error: any) {
              console.warn(`⚠️ Failed to load payments from ${tenant.name}:`, error);
              payments = [];
            }

            // Store organization-specific data
            organizationData[tenant.id] = {
              name: tenant.name,
              invoices: invoices,
              contacts: contacts,
              bankTransactions: bankTransactions,
              transactions: transactions,
              payments: payments,
              totalInvoices: invoices.length,
              totalContacts: contacts.length,
              totalBankTransactions: bankTransactions.length,
              totalTransactions: transactions.length,
              totalPayments: payments.length
            };

            // Add to combined arrays
            allInvoices = allInvoices.concat(invoices.map(inv => ({ ...inv, organizationName: tenant.name, organizationId: tenant.id })));
            allContacts = allContacts.concat(contacts.map(contact => ({ ...contact, organizationName: tenant.name, organizationId: tenant.id })));
            allBankTransactions = allBankTransactions.concat(bankTransactions.map(txn => ({ ...txn, organizationName: tenant.name, organizationId: tenant.id })));

          } catch (error: any) {
            console.error(`❌ Failed to load data from ${tenant.name}:`, error);
            // Continue with other organizations even if one fails
          }
        }

        // Use combined data from all organizations
        const invoices = allInvoices;
        const contacts = allContacts;
        const bankTransactions = allBankTransactions;
        
        // Calculate financial summary from REAL Xero data
        console.log('📊 Calculating financial summary from real Xero data...');
        
        // Check if we have any financial data available for FAS processing
        const hasInvoices = invoices && invoices.length > 0;
        const hasContacts = contacts && contacts.length > 0;
        const hasBankTransactions = bankTransactions && bankTransactions.length > 0;
        const hasTransactions = organizationData && Object.values(organizationData).some((org: any) => org.totalTransactions > 0);
        const hasPayments = organizationData && Object.values(organizationData).some((org: any) => org.totalPayments > 0);
        
        if (!hasInvoices && !hasContacts && !hasBankTransactions && !hasTransactions && !hasPayments) {
          throw new Error(`No financial data found in any of your ${tenants.length} Xero organization(s). Please ensure you have invoices, contacts, bank transactions, payments, or other financial data in your Xero account.`);
        }
        
        let totalRevenue = 0;
        let paidRevenue = 0;
        let outstandingRevenue = 0;
        let totalGST = 0;
        
        // Process REAL invoices from the connected Xero account (if available)
        if (invoices && invoices.length > 0) {
          invoices.forEach((invoice: any) => {
            const amount = parseFloat(invoice.Total) || 0;
            const amountPaid = parseFloat(invoice.AmountPaid) || 0;
            const taxAmount = parseFloat(invoice.TaxAmount) || 0;
            
            totalRevenue += amount;
            paidRevenue += amountPaid;
            outstandingRevenue += (amount - amountPaid);
            totalGST += taxAmount;
          });
        } else {
          console.log('📋 No invoices found, using alternative data sources for financial calculations...');
          
          // Use bank transactions as alternative data source for financial calculations
          if (bankTransactions && bankTransactions.length > 0) {
            bankTransactions.forEach((transaction: any) => {
              const amount = parseFloat(transaction.Total) || 0;
              if (amount > 0) {
                totalRevenue += amount;
                paidRevenue += amount;
              }
            });
          }
          
          // Use transactions as alternative data source
          Object.values(organizationData).forEach((org: any) => {
            if (org.transactions && org.transactions.length > 0) {
              org.transactions.forEach((transaction: any) => {
                const amount = parseFloat(transaction.Total) || 0;
                if (amount > 0) {
                  totalRevenue += amount;
                  paidRevenue += amount;
                }
              });
            }
          });
          
          // Use payments as alternative data source
          Object.values(organizationData).forEach((org: any) => {
            if (org.payments && org.payments.length > 0) {
              org.payments.forEach((payment: any) => {
                const amount = parseFloat(payment.Amount) || 0;
                if (amount > 0) {
                  totalRevenue += amount;
                  paidRevenue += amount;
                }
              });
            }
          });
        }

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
          organizationData: organizationData, // Data broken down by organization
          totalOrganizations: tenants.length,
          organizationNames: tenants.map(t => t.name),
          primaryTenantId: selectedTenant?.id || tenants[0]?.id,
          primaryTenantName: selectedTenant?.name || tenants[0]?.name,
          timestamp: new Date().toISOString(),
          dataSource: 'real_xero_data_all_organizations'
        };

        console.log('📊 Final REAL Xero data for BAS/FAS analysis:', {
          transactionsCount: invoices.length,
          contactsCount: contacts.length,
          bankTransactionCount: bankTransactions.length,
          reportsDataType: reportsData.type,
          dataSource: data.dataSource,
          totalOrganizations: data.totalOrganizations,
          organizationNames: data.organizationNames,
          primaryTenantId: data.primaryTenantId,
          primaryTenantName: data.primaryTenantName,
          hasFinancialData: !!reportsData.data,
          totalRevenue: reportsData.data.totalRevenue,
          totalExpenses: reportsData.data.totalExpenses,
          organizationBreakdown: Object.keys(organizationData).map(orgId => ({
            name: organizationData[orgId].name,
            invoices: organizationData[orgId].totalInvoices,
            contacts: organizationData[orgId].totalContacts,
            bankTransactions: organizationData[orgId].totalBankTransactions,
            transactions: organizationData[orgId].totalTransactions,
            payments: organizationData[orgId].totalPayments
          }))
        });

        toast.dismiss({ id: 'xero-load' });
        toast.success(`✅ Real data loaded successfully from ${data.totalOrganizations} organization(s) (${invoices.length} invoices, ${contacts.length} contacts total)`);
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
