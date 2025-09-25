import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/envChecker';

interface XeroDataDisplayProps {
  className?: string;
}

const SimpleXeroDataDisplay: React.FC<XeroDataDisplayProps> = ({ className = '' }) => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('organization');
  const [showDisconnectConfirmation, setShowDisconnectConfirmation] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const dataTypes = [
    { key: 'organization', label: '🏢 Organization', color: 'bg-blue-500' },
    { key: 'contacts', label: '👥 Contacts', color: 'bg-green-500' },
    { key: 'accounts', label: '🏦 Accounts', color: 'bg-purple-500' },
    { key: 'invoices', label: '📄 Invoices', color: 'bg-orange-500' },
    { key: 'items', label: '📦 Items', color: 'bg-cyan-500' },
    { key: 'bank-transactions', label: '💳 Bank Transactions', color: 'bg-indigo-500' },
    { key: 'tax-rates', label: '💰 Tax Rates', color: 'bg-yellow-500' },
    { key: 'receipts', label: '🧾 Receipts', color: 'bg-pink-500' },
    { key: 'purchase-orders', label: '🛒 Purchase Orders', color: 'bg-teal-500' },
    { key: 'quotes', label: '💬 Quotes', color: 'bg-red-500' }
  ];

  const loadDataType = async (type: string) => {
    setLoading(true);
    try {
      // Always use demo data for reliable display
      const response = await fetch(`${getApiUrl()}/api/xero/demo/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(prev => ({ ...prev, [type]: result.data }));
        toast.success(`✅ ${type} data loaded`);
      } else {
        toast.error(`Failed to load ${type} data`);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      toast.error(`Failed to load ${type} data`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    toast.loading('Loading all Xero data...', { id: 'loadAll' });
    
    try {
      for (const dataType of dataTypes) {
        await loadDataType(dataType.key);
      }
      toast.success('✅ All Xero data loaded successfully!', { id: 'loadAll' });
    } catch (error) {
      toast.error('Failed to load some data', { id: 'loadAll' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/xero/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setData({});
        setShowDisconnectConfirmation(false);
        toast.success('✅ Disconnected from Xero successfully');
        // Redirect to Xero flow page
        window.location.href = '/xero';
      } else {
        toast.error('Failed to disconnect from Xero');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect from Xero');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const confirmDisconnect = () => {
    setShowDisconnectConfirmation(true);
  };

  const cancelDisconnect = () => {
    setShowDisconnectConfirmation(false);
  };

  useEffect(() => {
    // Auto-load organization data on mount
    loadDataType('organization');
  }, []);

  const renderDataTable = (dataArray: any[], type: string) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return <div className="text-gray-500 text-center py-4">No data available</div>;
    }

    const firstItem = dataArray[0];
    const keys = Object.keys(firstItem); // Show ALL columns

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-800 capitalize">
            📋 {type.replace('-', ' ')} - Complete Data Table
          </h4>
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {keys.map(key => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataArray.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {keys.map(key => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof item[key] === 'object' && item[key] !== null ? (
                      <details className="inline">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          {Array.isArray(item[key]) ? `Array(${item[key].length})` : 'Object'}
                        </summary>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-xs max-w-xs overflow-auto">
                          <pre>{JSON.stringify(item[key], null, 2)}</pre>
                        </div>
                      </details>
                    ) : (
                      <span title={String(item[key] || 'N/A')}>
                        {String(item[key] || 'N/A').length > 50 ? 
                          String(item[key] || 'N/A').substring(0, 50) + '...' : 
                          String(item[key] || 'N/A')
                        }
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
          Showing all {dataArray.length} records with all columns
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Xero Data Display (Working Demo)
        </h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? '⏳ Loading...' : '🚀 Load All Data'}
          </button>
          
          <button
            onClick={() => setData({})}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🗑️ Clear Data
          </button>

          <button
            onClick={confirmDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 border-2 border-red-200"
          >
            🔌 Disconnect Xero
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {dataTypes.map(type => (
            <button
              key={type.key}
              onClick={() => {
                loadDataType(type.key);
                setSelectedType(type.key);
              }}
              disabled={loading}
              className={`px-3 py-2 text-sm text-white rounded-md hover:opacity-80 disabled:opacity-50 ${type.color}`}
            >
              {type.label}
              {data[type.key] && (
                <span className="ml-1 bg-white text-gray-800 px-1 rounded text-xs">
                  {Array.isArray(data[type.key]) ? data[type.key].length : 1}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Display */}
      <div className="space-y-6">
        {Object.keys(data).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">📊 Ready to Load Xero Data</p>
            <p>Click "Load All Data" or individual data type buttons above</p>
          </div>
        ) : (
          Object.entries(data).map(([type, typeData]) => (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {dataTypes.find(dt => dt.key === type)?.label || type}
                </h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {Array.isArray(typeData) ? `${typeData.length} records` : '1 record'}
                  </span>
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(typeData, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `xero-${type}-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('✅ Data exported');
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                  >
                    📥 Export
                  </button>
                </div>
              </div>
              
              {Array.isArray(typeData) ? (
                renderDataTable(typeData, type)
              ) : (
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(typeData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {Object.keys(data).length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📈 Data Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {Object.entries(data).map(([type, typeData]) => (
              <div key={type} className="text-center">
                <div className="font-medium text-blue-800 capitalize">{type}</div>
                <div className="text-blue-600">
                  {Array.isArray(typeData) ? typeData.length : 1} records
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-red-600 text-3xl mr-3">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900">Disconnect Xero</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to disconnect from Xero? This will:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
                  <li>Disconnect your Xero account</li>
                  <li>Clear all loaded data</li>
                  <li>Require re-authentication to use Xero features</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 font-medium"
                >
                  {isDisconnecting ? '⏳ Disconnecting...' : '🔌 Disconnect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleXeroDataDisplay;
