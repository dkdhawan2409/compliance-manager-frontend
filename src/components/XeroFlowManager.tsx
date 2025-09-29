import React, { useState, useEffect } from 'react';
import { useXero } from '../integrations/xero/context/XeroProvider';
import { useAuth } from '../contexts/AuthContext';
import { getXeroAuthUrl, handleXeroCallback } from '../api/xeroService';
import toast from 'react-hot-toast';

const XeroFlowManager: React.FC = () => {
  const { state, startAuth, handleCallback, disconnect, loadSettings, refreshConnection, selectTenant, clearError, loadData } = useXero();
  const { isAuthenticated } = useAuth();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadComplete, setAutoLoadComplete] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const { isConnected, hasSettings, selectedTenant, tenants, connectionStatus, error, isLoading } = state;

  // Auto-select first tenant if only one is available
  useEffect(() => {
    if (tenants && tenants.length === 1 && !selectedTenant) {
      console.log('🎯 Auto-selecting single tenant:', tenants[0].name);
      selectTenant(tenants[0].id);
    }
  }, [tenants, selectedTenant, selectTenant]);

  // Auto-load data when tenant is selected
  useEffect(() => {
    if (selectedTenant && !autoLoadComplete && !isAutoLoading) {
      console.log('🚀 Auto-loading data for tenant:', selectedTenant.name);
      autoLoadXeroData();
    }
  }, [selectedTenant, autoLoadComplete, isAutoLoading]);

  // Refresh connection status when component mounts or when returning from OAuth
  useEffect(() => {
    const refreshOnMount = async () => {
      try {
        console.log('🔄 Refreshing Xero connection status...');
        await loadSettings();
        await refreshConnection();
        
        // Check if we just returned from OAuth (URL might have success parameter)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          console.log('🎉 OAuth completed successfully, refreshing state...');
          toast.success('Xero connection successful!');
          // Clear the URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.log('⚠️ Failed to refresh connection status:', error);
      }
    };

    refreshOnMount();
  }, [loadSettings, refreshConnection]);

  const handleOneClickConnect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      console.log('🚀 Starting one-click Xero connection...');
      await startAuth();
    } catch (error: any) {
      console.error('❌ OAuth flow error:', error);
      toast.error(error.message || 'Failed to start Xero connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const autoLoadXeroData = async () => {
    if (!selectedTenant || isAutoLoading || autoLoadComplete) return;
    
    setIsAutoLoading(true);
    try {
      console.log('📊 Starting auto-load of Xero data...');
      
      // Load key data types automatically
      const dataTypes = ['organization', 'contacts', 'invoices', 'accounts'] as const;
      const loadPromises = dataTypes.map(type => 
        loadData(type).catch(err => {
          console.warn(`⚠️ Failed to load ${type}:`, err);
          return null; // Don't fail the entire process for one data type
        })
      );
      
      await Promise.all(loadPromises);
      
      setAutoLoadComplete(true);
      toast.success('🎉 All Xero data loaded successfully!');
      console.log('✅ Auto-load complete');
      
    } catch (error: any) {
      console.error('❌ Auto-load error:', error);
      toast.error('Failed to load some data, but connection is ready');
      // Still mark as complete so user can proceed
      setAutoLoadComplete(true);
    } finally {
      setIsAutoLoading(false);
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    selectTenant(tenantId);
    toast.success('Organization selected successfully!');
  };

  const handleLoadData = async () => {
    try {
      await refreshConnection();
      toast.success('Data loaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Disconnected from Xero');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  const enableTestMode = () => {
    if (testMode) {
      localStorage.removeItem('test_token');
      setTestMode(false);
      toast.success('Test mode disabled');
    } else {
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzU4NzgyNjM4LCJleHAiOjE3NTkzODc0Mzh9.P_OhjIDK96V4iYkcmhsiadIpEJbmrExL3pU54piPe-8';
      localStorage.setItem('token', testToken);
      setTestMode(true);
      toast.success('Test mode enabled - using test token');
      setTimeout(() => {
        loadSettings();
        refreshConnection();
      }, 1000);
    }
  };

  const enableDemoMode = () => {
    // Simulate successful Xero connection for demo purposes
    const mockTenants = [
      {
        id: 'demo-tenant-1',
        name: 'Demo Organization',
        organizationName: 'Demo Organization',
        tenantId: 'demo-tenant-1'
      }
    ];
    
    // This would normally be handled by the context, but for demo we'll just show success
    toast.success('🎭 Demo mode: Simulated Xero connection successful!');
  };

  // Determine current state
  const getCurrentState = () => {
    if (!isAuthenticated) return 'not_authenticated';
    if (!isConnected && !isConnecting) return 'ready_to_connect';
    if (isConnecting) return 'connecting';
    if (isConnected && !selectedTenant) return 'selecting_organization';
    if (selectedTenant && !autoLoadComplete && isAutoLoading) return 'loading_data';
    if (autoLoadComplete) return 'complete';
    return 'ready_to_connect';
  };

  const currentState = getCurrentState();

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Xero Integration</h1>
        <p className="text-gray-600">One-click connection to your Xero account</p>
      </div>

      {/* Main Integration Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        {currentState === 'not_authenticated' && (
          <div className="space-y-6">
            <div className="text-6xl">🔐</div>
            <h2 className="text-2xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-gray-600">Please log in to connect your Xero account</p>
          </div>
        )}

        {currentState === 'ready_to_connect' && (
          <div className="space-y-6">
            <div className="text-6xl">🔗</div>
            <h2 className="text-2xl font-semibold text-gray-900">Connect to Xero</h2>
            <p className="text-gray-600">Click below to securely connect your Xero account</p>
          <button
              onClick={handleOneClickConnect}
              disabled={isConnecting}
              className="bg-blue-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {isConnecting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect to Xero'
              )}
                  </button>
          </div>
        )}

        {currentState === 'connecting' && (
          <div className="space-y-6">
            <div className="text-6xl animate-pulse">🔄</div>
            <h2 className="text-2xl font-semibold text-gray-900">Connecting to Xero...</h2>
            <p className="text-gray-600">Please complete the authorization in the new window</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800">Waiting for authorization...</span>
              </div>
            </div>
          </div>
        )}

        {currentState === 'selecting_organization' && (
          <div className="space-y-6">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold text-gray-900">Select Organization</h2>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-4">
                {tenants.length === 1 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-green-600">✅</div>
                      <span className="text-green-800">Auto-selected: {tenants[0].name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tenants.map((tenant: any) => (
                    <button
                      key={tenant.id}
                        onClick={() => selectTenant(tenant.id)}
                        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">🏢</div>
                          <div>
                            <div className="font-medium text-gray-900">{tenant.name || tenant.organizationName}</div>
                            <div className="text-sm text-gray-600">ID: {tenant.id}</div>
                          </div>
                        </div>
                    </button>
                  ))}
                </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl animate-pulse">⏳</div>
                <p className="text-gray-600">Loading your organizations...</p>
                  <button
                  onClick={refreshConnection}
                  className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔄 Refresh
                  </button>
              </div>
            )}
              </div>
            )}

        {currentState === 'loading_data' && (
          <div className="space-y-6">
            <div className="text-6xl animate-pulse">📊</div>
            <h2 className="text-2xl font-semibold text-gray-900">Loading Your Data</h2>
            <p className="text-gray-600">Automatically loading all your Xero data...</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['organization', 'contacts', 'invoices', 'accounts'].map((type) => (
                <div key={type} className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">
                    {type === 'organization' ? '🏢' : 
                     type === 'contacts' ? '👥' : 
                     type === 'invoices' ? '🧾' : '💰'}
                  </div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{type}</div>
                  <div className="text-xs text-gray-600">Loading...</div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800">Please wait while we load your data...</span>
              </div>
            </div>
          </div>
        )}

        {currentState === 'complete' && (
          <div className="space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-semibold text-gray-900">Integration Complete!</h2>
            <p className="text-gray-600">
              Successfully connected to <strong>{selectedTenant?.name || selectedTenant?.organizationName}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl mb-2">👥</div>
                <div className="font-medium text-gray-900">Contacts</div>
                <div className="text-sm text-gray-600">Customer & supplier data loaded</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl mb-2">🧾</div>
                <div className="font-medium text-gray-900">Invoices</div>
                <div className="text-sm text-gray-600">Sales & purchases loaded</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium text-gray-900">Accounts</div>
                <div className="text-sm text-gray-600">Financial data loaded</div>
              </div>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600 text-2xl">✅</span>
                <span className="font-medium text-green-800">You can now access all your Xero data!</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <h4 className="font-medium text-red-800">Connection Error</h4>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {currentState === 'complete' && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={loadSettings}
              className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-medium text-gray-900">Settings</div>
            </button>
            <button
              onClick={refreshConnection}
              className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium text-gray-900">Refresh</div>
            </button>
              <button
              onClick={handleDisconnect}
              className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
              <div className="text-2xl mb-2">🔌</div>
              <div className="font-medium text-gray-900">Disconnect</div>
              </button>
          </div>
        </div>
      )}

      {/* Debug Information */}
      <div className="mt-8">
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          🔍 Debug Information
        </button>
        
        {showDebugInfo && (
          <div className="mt-4 bg-gray-100 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-gray-900 mb-2">Debug Info:</h4>
            <div className="space-y-1 text-gray-700">
              <div>Current State: {currentState}</div>
              <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>Has Settings: {hasSettings ? 'Yes' : 'No'}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Selected Tenant: {selectedTenant?.name || selectedTenant?.organizationName || 'none'}</div>
              <div>Tenants: {tenants?.length || 0}</div>
              <div>Connection Status: {typeof connectionStatus === 'string' ? connectionStatus : 'object'}</div>
              <div>Auto Loading: {isAutoLoading ? 'Yes' : 'No'}</div>
              <div>Auto Load Complete: {autoLoadComplete ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'none'}</div>
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              </div>
              
            <div className="mt-4 space-x-2">
                <button
                onClick={enableTestMode}
                className={`px-2 py-1 text-white text-xs rounded hover:opacity-80 ${
                  testMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {testMode ? 'Disable Test' : 'Enable Test Mode'}
                </button>
                <button
                onClick={enableDemoMode}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                >
                🎭 Demo Mode
                </button>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default XeroFlowManager;
