import React from 'react';

interface XeroDataTableProps {
  data: any;
  resourceType: string;
}

const XeroDataTable: React.FC<XeroDataTableProps> = ({ data, resourceType }) => {
  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getResourceIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'invoices': '📄',
      'contacts': '👥',
      'bank-transactions': '🏦',
      'accounts': '📊',
      'items': '📦',
      'tax-rates': '💰',
      'tracking-categories': '🏷️',
      'organization': '🏢',
      'purchase-orders': '🛒',
      'receipts': '🧾',
      'credit-notes': '📝',
      'manual-journals': '📔',
      'prepayments': '💳',
      'overpayments': '💸',
      'quotes': '💬',
      'reports': '📈'
    };
    return icons[type] || '📋';
  };

  const getResourceDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      'invoices': 'Invoices',
      'contacts': 'Contacts',
      'bank-transactions': 'Bank Transactions',
      'accounts': 'Accounts',
      'items': 'Items',
      'tax-rates': 'Tax Rates',
      'tracking-categories': 'Tracking Categories',
      'organization': 'Organization',
      'purchase-orders': 'Purchase Orders',
      'receipts': 'Receipts',
      'credit-notes': 'Credit Notes',
      'manual-journals': 'Manual Journals',
      'prepayments': 'Prepayments',
      'overpayments': 'Overpayments',
      'quotes': 'Quotes',
      'reports': 'Reports'
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  const renderTable = () => {
    if (!data || !Array.isArray(data)) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500">No {resourceType} found</p>
        </div>
      );
    }

    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach((item: any) => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const keys = Array.from(allKeys);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {keys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                {keys.map((key) => (
                  <td
                    key={key}
                    className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100"
                  >
                    <div className="max-w-xs truncate" title={renderValue(item[key])}>
                      {renderValue(item[key])}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummary = () => {
    if (!data || !Array.isArray(data)) return null;

    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{getResourceIcon(resourceType)}</span>
          <h3 className="text-lg font-semibold text-blue-800">
            {getResourceDisplayName(resourceType)} Summary
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-blue-700">Total Records</div>
            <div className="text-2xl font-bold text-blue-900">{data.length}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-blue-700">Resource Type</div>
            <div className="text-lg font-semibold text-blue-900">{getResourceDisplayName(resourceType)}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-blue-700">Data Type</div>
            <div className="text-lg font-semibold text-blue-900">Array</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-blue-700">Status</div>
            <div className="text-lg font-semibold text-green-600">✓ Loaded</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSummary()}
      {renderTable()}
    </div>
  );
};

export default XeroDataTable; 