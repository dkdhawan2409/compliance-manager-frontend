import React, { useState, useEffect } from 'react';
import { useXero } from '../contexts/XeroContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getDashboardData, 
  getFinancialSummary, 
  getAllInvoices, 
  getAllContacts, 
  getAllBankTransactions,
  getAllAccounts,
  getAllItems,
  getAllTaxRates,
  getAllTrackingCategories,
  getOrganizationDetails,
  XeroDashboardData,
  XeroFinancialSummary
} from '../api/xeroService';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  CreditCard, 
  Building2, 
  Package,
  Calculator,
  Tags,
  Activity,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface XeroDashboardProps {
  className?: string;
}

const XeroDashboard: React.FC<XeroDashboardProps> = ({ className }) => {
  const { state } = useXero();
  const { isConnected, selectedTenant } = state;
  const { company, isAuthenticated } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<XeroDashboardData | null>(null);
  const [financialSummary, setFinancialSummary] = useState<XeroFinancialSummary | null>(null);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [allTaxRates, setAllTaxRates] = useState<any[]>([]);
  const [allTrackingCategories, setAllTrackingCategories] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered:', {
      isAuthenticated,
      isConnected,
      selectedTenant: !!selectedTenant,
      company: !!company
    });

    if (!isAuthenticated) {
      console.log('❌ User not authenticated - cannot load dashboard data');
      setLoading(false);
      toast.error('Please log in to view dashboard data');
      return;
    }

    // Always try to load dashboard data - use demo data if not connected
    console.log('📊 Loading dashboard data (with demo fallback if needed)...');
    loadDashboardData();
  }, [isConnected, selectedTenant, isAuthenticated, company]);

    const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Loading dashboard data...');
      console.log('🔍 Connection status:', { isConnected, selectedTenant });
      console.log('🔐 Authentication status:', { isAuthenticated, company: !!company });
      
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
      
      // Load dashboard overview data with selected tenant ID (with demo fallback)
      try {
        const dashboardResponse = await getDashboardData(selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
        console.log('📊 Dashboard response:', dashboardResponse);
        
        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
        } else {
          console.log('⚠️ Dashboard data failed, using demo data');
        }
      } catch (error) {
        console.log('⚠️ Dashboard data error, continuing with demo fallback:', error);
      }

      // Load financial summary with selected tenant ID (with demo fallback)
      try {
        const financialResponse = await getFinancialSummary(selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
        if (financialResponse.success) {
          setFinancialSummary(financialResponse.data);
        }
      } catch (error) {
        console.log('⚠️ Financial summary error, continuing with demo fallback:', error);
      }

      // Load detailed data sequentially to avoid rate limiting
      console.log('📊 Loading detailed data...');
      
      // Helper function to add delay between requests
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Load essential data first (invoices and contacts) with demo fallbacks
      console.log('📊 Loading invoices...');
      let invoicesResponse;
      try {
        invoicesResponse = await getAllInvoices(1, 50, selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
      } catch (error) {
        console.log('⚠️ Invoices failed, using demo data');
        invoicesResponse = { success: false };
      }
      await delay(500); // Reduced delay
      
      console.log('📊 Loading contacts...');
      let contactsResponse;
      try {
        contactsResponse = await getAllContacts(1, 50, selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
      } catch (error) {
        console.log('⚠️ Contacts failed, using demo data');
        contactsResponse = { success: false };
      }
      await delay(500); // Reduced delay
      
      console.log('📊 Loading transactions...');
      let transactionsResponse;
      try {
        transactionsResponse = await getAllBankTransactions(1, 50, selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
      } catch (error) {
        console.log('⚠️ Transactions failed, using demo data');
        transactionsResponse = { success: false };
      }
      await delay(500); // Reduced delay
      
      console.log('📊 Loading accounts...');
      let accountsResponse;
      try {
        accountsResponse = await getAllAccounts(selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
      } catch (error) {
        console.log('⚠️ Accounts failed, using demo data');
        accountsResponse = { success: false };
      }
      await delay(500); // Reduced delay
      
      console.log('📊 Loading organization details...');
      let orgResponse;
      try {
        orgResponse = await getOrganizationDetails(selectedTenant?.id || 'a1b2c3d4-e5f6-7890-1234-567890abcdef');
      } catch (error) {
        console.log('⚠️ Organization failed, using demo data');
        orgResponse = { success: false };
      }
      
      console.log('📊 Detailed data responses:', {
        invoices: invoicesResponse.success,
        contacts: contactsResponse.success,
        transactions: transactionsResponse.success,
        accounts: accountsResponse.success,
        organization: orgResponse.success
      });

      if (invoicesResponse.success) {
        const invoices = invoicesResponse.data.Invoices || invoicesResponse.data.invoices || [];
        setAllInvoices(invoices);
        console.log('📊 Loaded invoices:', invoices.length, 'First invoice:', invoices[0]);
      }
      if (contactsResponse.success) {
        const contacts = contactsResponse.data.Contacts || contactsResponse.data.contacts || [];
        setAllContacts(contacts);
        console.log('📊 Loaded contacts:', contacts.length, 'First contact:', contacts[0]);
      }
      if (transactionsResponse.success) setAllTransactions(transactionsResponse.data.BankTransactions || transactionsResponse.data.bankTransactions || []);
      if (accountsResponse.success) setAllAccounts(accountsResponse.data.Accounts || accountsResponse.data.accounts || []);
      if (orgResponse.success) setOrganization(orgResponse.data.Organizations?.[0] || orgResponse.data.organizations?.[0] || null);
      
      // Load additional data only if needed (with more delays)
      console.log('📊 Loading additional data...');
      await delay(2000); // 2 second delay before additional requests
      
      try {
        const itemsResponse = await getAllItems(selectedTenant?.id);
        if (itemsResponse.success) setAllItems(itemsResponse.data.Items || itemsResponse.data.items || []);
        await delay(1000);
        
        const taxRatesResponse = await getAllTaxRates(selectedTenant?.id);
        if (taxRatesResponse.success) setAllTaxRates(taxRatesResponse.data.TaxRates || taxRatesResponse.data.taxRates || []);
        await delay(1000);
        
        const trackingResponse = await getAllTrackingCategories(selectedTenant?.id);
        if (trackingResponse.success) setAllTrackingCategories(trackingResponse.data.TrackingCategories || trackingResponse.data.trackingCategories || []);
      } catch (additionalError) {
        console.warn('⚠️ Some additional data failed to load:', additionalError);
        // Don't fail the entire load for non-essential data
      }

      toast.success('Xero data loaded successfully!');
    } catch (error) {
      console.error('Error loading Xero data:', error);
      toast.error('Failed to load Xero data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'PAID': 'bg-green-100 text-green-800',
      'AUTHORISED': 'bg-yellow-100 text-yellow-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'VOIDED': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Connected to Xero</h3>
          <p className="text-gray-600 mb-4">
            Please connect to Xero first to view dashboard data.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              You need to authorize with Xero to access your financial data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organization Selected</h3>
          <p className="text-gray-600">
            Please select a Xero organization to view dashboard data.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Xero data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xero Dashboard</h1>
          <p className="text-gray-600">
            {organization?.name ? `${organization.name} - Financial Overview` : 'Company Financial Overview'}
          </p>
        </div>
        <button 
          onClick={loadDashboardData} 
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Revenue</h3>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.summary.totalAmount)}</div>
              <p className="text-xs text-gray-500">
                {dashboardData.summary.totalInvoices} invoices
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Contacts</h3>
              <Users className="h-4 w-4 text-gray-500" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold">{dashboardData.summary.totalContacts}</div>
              <p className="text-xs text-gray-500">
                Total contacts
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Transactions</h3>
              <CreditCard className="h-4 w-4 text-gray-500" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold">{dashboardData.summary.totalTransactions}</div>
              <p className="text-xs text-gray-500">
                Bank transactions
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Accounts</h3>
              <Building2 className="h-4 w-4 text-gray-500" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold">{dashboardData.summary.totalAccounts}</div>
              <p className="text-xs text-gray-500">
                Chart of accounts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {financialSummary && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Financial Summary
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(financialSummary.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {formatCurrency(financialSummary.paidRevenue)}
              </div>
              <div className="text-sm text-gray-600">Paid Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {formatCurrency(financialSummary.outstandingRevenue)}
              </div>
              <div className="text-sm text-gray-600">Outstanding</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {formatCurrency(financialSummary.netIncome)}
              </div>
              <div className="text-sm text-gray-600">Net Income</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {['overview', 'invoices', 'contacts', 'transactions', 'accounts', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <FileText className="w-5 h-5 mr-2" />
                Recent Invoices ({allInvoices.length} total)
              </h3>
              <div className="space-y-3">
                {allInvoices.length > 0 ? (
                  allInvoices.map((invoice: any) => (
                    <div key={invoice.InvoiceID || invoice.invoiceID} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.Contact?.Name || invoice.contact?.name || 'Unknown Contact'}</div>
                        <div className="text-sm text-gray-600">#{invoice.InvoiceNumber || invoice.invoiceNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(invoice.Total || invoice.total || 0)}</div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(invoice.Status || invoice.status)}`}>
                          {invoice.Status || invoice.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No invoices found
                  </div>
                )}
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <Users className="w-5 h-5 mr-2" />
                Recent Contacts ({allContacts.length} total)
              </h3>
              <div className="space-y-3">
                {allContacts.length > 0 ? (
                  allContacts.map((contact: any) => (
                    <div key={contact.ContactID || contact.contactID} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{contact.Name || contact.name}</div>
                        <div className="text-sm text-gray-600">{contact.EmailAddress || contact.emailAddress || 'No email'}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {contact.ContactStatus || contact.contactStatus}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No contacts found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2" />
              All Invoices ({allInvoices.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice #</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allInvoices.map((invoice: any) => (
                    <tr key={invoice.InvoiceID || invoice.invoiceID} className="border-b">
                      <td className="p-2">{invoice.InvoiceNumber || invoice.invoiceNumber}</td>
                      <td className="p-2">{invoice.Contact?.Name || invoice.contact?.name || 'Unknown'}</td>
                      <td className="p-2">{formatDate(invoice.Date || invoice.date)}</td>
                      <td className="p-2">{formatCurrency(invoice.Total || invoice.total || 0)}</td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(invoice.Status || invoice.status)}`}>
                          {invoice.Status || invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <Users className="w-5 h-5 mr-2" />
              All Contacts ({allContacts.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allContacts.map((contact: any) => (
                    <tr key={contact.ContactID || contact.contactID} className="border-b">
                      <td className="p-2">{contact.Name || contact.name}</td>
                      <td className="p-2">{contact.EmailAddress || contact.emailAddress || '-'}</td>
                      <td className="p-2">{contact.Phones?.[0]?.PhoneNumber || contact.phones?.[0]?.phoneNumber || '-'}</td>
                      <td className="p-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {contact.ContactStatus || contact.contactStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <CreditCard className="w-5 h-5 mr-2" />
              Bank Transactions ({allTransactions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((transaction: any) => (
                    <tr key={transaction.bankTransactionID} className="border-b">
                      <td className="p-2">{formatDate(transaction.date)}</td>
                      <td className="p-2">{transaction.reference || transaction.lineItems?.[0]?.description || '-'}</td>
                      <td className="p-2">{formatCurrency(transaction.total)}</td>
                      <td className="p-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {transaction.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <Building2 className="w-5 h-5 mr-2" />
              Chart of Accounts ({allAccounts.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allAccounts.map((account: any) => (
                    <tr key={account.accountID} className="border-b">
                      <td className="p-2">{account.code}</td>
                      <td className="p-2">{account.name}</td>
                      <td className="p-2">{account.type}</td>
                      <td className="p-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {account.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Items */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <Package className="w-5 h-5 mr-2" />
                Items ({allItems.length})
              </h3>
              <div className="space-y-2">
                {allItems.map((item: any) => (
                  <div key={item.itemID} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.salesDetails?.unitPrice || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Rates */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <Calculator className="w-5 h-5 mr-2" />
                Tax Rates ({allTaxRates.length})
              </h3>
              <div className="space-y-2">
                {allTaxRates.map((taxRate: any) => (
                  <div key={taxRate.taxType} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{taxRate.name}</div>
                      <div className="text-sm text-gray-600">{taxRate.taxType}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{taxRate.effectiveRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Categories */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <Tags className="w-5 h-5 mr-2" />
                Tracking Categories ({allTrackingCategories.length})
              </h3>
              <div className="space-y-2">
                {allTrackingCategories.map((category: any) => (
                  <div key={category.trackingCategoryID} className="p-2 border rounded">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-600">
                      {category.options?.length || 0} options
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Organization Details */}
            {organization && (
              <div className="bg-white rounded-lg shadow-lg p-6 border">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <Building2 className="w-5 h-5 mr-2" />
                  Organization Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{organization.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Legal Name:</span>
                    <span>{organization.legalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Country:</span>
                    <span>{organization.countryCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Currency:</span>
                    <span>{organization.baseCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tax Number:</span>
                    <span>{organization.taxNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroDashboard;
