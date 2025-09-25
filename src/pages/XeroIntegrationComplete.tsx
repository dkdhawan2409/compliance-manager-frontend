import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useXero } from '../contexts/XeroContext';
import { getApiUrl } from '../utils/envChecker';
import toast from 'react-hot-toast';

interface XeroData {
  organization?: any;
  contacts?: any[];
  accounts?: any[];
  invoices?: any[];
  items?: any[];
  bankTransactions?: any[];
  taxRates?: any[];
  receipts?: any[];
  purchaseOrders?: any[];
  quotes?: any[];
}

const XeroIntegrationComplete: React.FC = () => {
  const { isAuthenticated, company } = useAuth();
  const { 
    isConnected, 
    hasSettings, 
    selectedTenant, 
    tenants,
    connectionStatus,
    error,
    isLoading,
    startAuth,
    handleCallback,
    disconnect,
    loadSettings,
    refreshConnection,
    selectTenant
  } = useXero();

  const [xeroData, setXeroData] = useState<XeroData>({});
  const [loadingData, setLoadingData] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<string>('organization');
  const [showAllData, setShowAllData] = useState(false);

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

  // Check for OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleCallback(code, state);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleCallback]);

  // Auto-load settings and data when connected
  useEffect(() => {
    if (isConnected && hasSettings && selectedTenant) {
      loadDataType('organization');
    }
  }, [isConnected, hasSettings, selectedTenant]);

  const handleConnectXero = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      return;
    }

    try {
      setLoadingData(true);
      await startAuth();
    } catch (error: any) {
      console.error('Connect Xero Error:', error);
      toast.error('Failed to connect to Xero. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDisconnectXero = async () => {
    try {
      await disconnect();
      setXeroData({});
      toast.success('Successfully disconnected from Xero');
    } catch (error: any) {
      console.error('Disconnect Error:', error);
      toast.error('Failed to disconnect from Xero');
    }
  };

  // Map frontend data types to backend endpoints
  const getBackendEndpoint = (type: string) => {
    const endpointMap: { [key: string]: string } = {
      'organization': '/api/xero/organization-details',
      'contacts': '/api/xero/all-contacts',
      'accounts': '/api/xero/all-accounts',
      'invoices': '/api/xero/all-invoices',
      'items': '/api/xero/all-items',
      'bank-transactions': '/api/xero/all-bank-transactions',
      'tax-rates': '/api/xero/all-tax-rates',
      'receipts': '/api/xero/all-receipts',
      'purchase-orders': '/api/xero/all-purchase-orders',
      'quotes': '/api/xero/all-quotes'
    };
    return endpointMap[type] || `/api/xero/data/${type}`;
  };

  const loadDataType = async (type: string) => {
    if (!isConnected || !selectedTenant) {
      toast.error('Please connect to Xero first');
      return;
    }

    setLoadingData(true);
    try {
      const endpoint = getBackendEndpoint(type);
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setXeroData(prev => ({ ...prev, [type]: result.data }));
        toast.success(`✅ ${type} data loaded successfully`);
      } else {
        toast.error(`Failed to load ${type} data`);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      toast.error(`Failed to load ${type} data`);
    } finally {
      setLoadingData(false);
    }
  };

  const loadAllData = async () => {
    if (!isConnected || !selectedTenant) {
      toast.error('Please connect to Xero first');
      return;
    }

    setLoadingData(true);
    toast.loading('Loading all Xero data...', { id: 'loadAll' });
    
    try {
      for (const dataType of dataTypes) {
        await loadDataType(dataType.key);
      }
      setShowAllData(true);
      toast.success('✅ All Xero data loaded successfully!', { id: 'loadAll' });
    } catch (error) {
      toast.error('Failed to load some data', { id: 'loadAll' });
    } finally {
      setLoadingData(false);
    }
  };

  const renderDataTable = (dataArray: any[], type: string) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return <div className="text-gray-500 text-center py-4">No data available</div>;
    }

    const firstItem = dataArray[0];
    const keys = Object.keys(firstItem);

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-800 capitalize">
            📋 {type.replace('-', ' ')} - {dataArray.length} Records
          </h4>
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {keys.slice(0, 8).map(key => (
                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataArray.slice(0, 10).map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {keys.slice(0, 8).map(key => (
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
                          {String(item[key] || 'N/A').length > 30 ? 
                            String(item[key] || 'N/A').substring(0, 30) + '...' : 
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
        {dataArray.length > 10 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
            Showing first 10 of {dataArray.length} records
          </div>
        )}
      </div>
    );
  };

  const renderConnectionStatus = () => {
    if (!isAuthenticated) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Authentication Required</h3>
          <p className="text-red-600">Please log in to access Xero integration</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-6xl mb-4">⏳</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Loading...</h3>
          <p className="text-blue-600">Please wait while we check your Xero connection</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshConnection}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            🔄 Retry Connection
          </button>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Connect to Xero</h3>
          <p className="text-yellow-600 mb-4">
            Connect your Xero account to access your financial data
          </p>
          <button
            onClick={handleConnectXero}
            disabled={loadingData}
            className="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 font-medium"
          >
            {loadingData ? '⏳ Connecting...' : '🚀 Connect to Xero'}
          </button>
        </div>
      );
    }

    if (!hasSettings) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <div className="text-orange-600 text-6xl mb-4">⚙️</div>
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Xero Settings Required</h3>
          <p className="text-orange-600 mb-4">
            Xero credentials need to be configured for your company
          </p>
          <button
            onClick={loadSettings}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            🔄 Load Settings
          </button>
        </div>
      );
    }

    if (!selectedTenant) {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <div className="text-purple-600 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Select Organization</h3>
          <p className="text-purple-600 mb-4">
            Choose which Xero organization to work with
          </p>
          {tenants.length > 0 ? (
            <div className="space-y-2">
              {tenants.map(tenant => (
                <button
                  key={tenant.tenantId}
                  onClick={() => selectTenant(tenant)}
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-left"
                >
                  🏢 {tenant.tenantName}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={refreshConnection}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              🔄 Refresh Organizations
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Connected to Xero</h3>
        <p className="text-green-600 mb-4">
          Organization: <strong>{selectedTenant.tenantName}</strong>
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={loadAllData}
            disabled={loadingData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loadingData ? '⏳ Loading...' : '🚀 Load All Data'}
          </button>
          <button
            onClick={handleDisconnectXero}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            🔌 Disconnect
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Complete Xero Integration
          </h1>
          <p className="text-gray-600">
            Connect, authenticate, and manage all your Xero data in one place
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-8">
          {renderConnectionStatus()}
        </div>

        {/* Data Loading Controls */}
        {isConnected && hasSettings && selectedTenant && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Data Management
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              {dataTypes.map(type => (
                <button
                  key={type.key}
                  onClick={() => {
                    loadDataType(type.key);
                    setSelectedDataType(type.key);
                  }}
                  disabled={loadingData}
                  className={`px-3 py-2 text-sm text-white rounded-md hover:opacity-80 disabled:opacity-50 ${type.color}`}
                >
                  {type.label}
                  {xeroData[type.key as keyof XeroData] && (
                    <span className="ml-1 bg-white text-gray-800 px-1 rounded text-xs">
                      {Array.isArray(xeroData[type.key as keyof XeroData]) ? 
                        (xeroData[type.key as keyof XeroData] as any[]).length : 1}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowAllData(!showAllData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showAllData ? '📋 Hide All Data' : '📋 Show All Data'}
              </button>
              <button
                onClick={() => setXeroData({})}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                🗑️ Clear Data
              </button>
            </div>
          </div>
        )}

        {/* Data Display */}
        {isConnected && hasSettings && selectedTenant && Object.keys(xeroData).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📈 Xero Data
            </h2>
            
            {showAllData ? (
              <div className="space-y-6">
                {Object.entries(xeroData).map(([type, typeData]) => (
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">📊 Data Loaded Successfully</p>
                <p>Click "Show All Data" to view your Xero data</p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {isConnected && hasSettings && selectedTenant && Object.keys(xeroData).length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📈 Data Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              {Object.entries(xeroData).map(([type, typeData]) => (
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
      </div>
    </div>
  );
};

export default XeroIntegrationComplete;
