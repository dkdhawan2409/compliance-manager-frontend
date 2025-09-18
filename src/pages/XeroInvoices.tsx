import React, { useEffect, useState } from 'react';
import { useXero } from '../contexts/XeroContext';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';

const XeroInvoices: React.FC = () => {
  const { state: xeroState, loadData } = useXero();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (xeroState.isConnected) {
      loadInvoiceData();
    }
  }, [xeroState.isConnected]);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      const data = await loadData('invoices');
      setInvoices(Array.isArray(data) ? data : []);
      toast.success('✅ Invoices loaded from global Xero context');
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📄 Xero Invoices
          </h1>
          <p className="text-gray-600">
            View and manage your Xero invoices with global data access
          </p>
        </div>

        {!xeroState.isConnected ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔗 Connect to Xero First</h3>
            <p className="text-yellow-700 mb-4">
              You need to connect to Xero to view invoice data.
            </p>
            <a 
              href="/integrations/xero"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Xero Integration
            </a>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading invoices...</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Invoice Data ({invoices.length} records)
              </h2>
              <button
                onClick={loadInvoiceData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🔄 Refresh Data
              </button>
            </div>
            
            {invoices.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice, index) => (
                        <tr key={invoice.InvoiceID || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.InvoiceNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.Contact?.Name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.Date ? new Date(invoice.Date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${invoice.Total || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              invoice.Status === 'PAID' ? 'bg-green-100 text-green-800' :
                              invoice.Status === 'AUTHORISED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.Status || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500">
                  Showing all {invoices.length} invoices
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No invoice data available
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default XeroInvoices;