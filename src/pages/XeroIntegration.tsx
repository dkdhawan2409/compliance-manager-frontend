import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';
import { XERO_RESOURCE_TYPES, type XeroResourceType } from '../api/xeroService';
import { useXero } from '../contexts/XeroContext';
import XeroDataTable from '../components/XeroDataTable';
import XeroSettings from '../components/XeroSettings';

import XeroDashboard from '../components/XeroDashboard';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';

// Helper functions for resource display
const getResourceDisplayName = (resource: string): string => {
  const displayNames: Record<string, string> = {
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
  return displayNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1).replace('-', ' ');
};

const getResourceDescription = (resource: string): string => {
  const descriptions: Record<string, string> = {
    'invoices': 'Customer invoices & bills',
    'contacts': 'Customers & suppliers',
    'bank-transactions': 'Bank account transactions',
    'accounts': 'Chart of accounts',
    'items': 'Products & services',
    'tax-rates': 'Tax rate configurations',
    'tracking-categories': 'Tracking categories',
    'organization': 'Company details',
    'purchase-orders': 'Purchase orders',
    'receipts': 'Expense receipts',
    'credit-notes': 'Credit notes & refunds',
    'manual-journals': 'Manual journal entries',
    'prepayments': 'Prepayment transactions',
    'overpayments': 'Overpayment transactions',
    'quotes': 'Sales quotes',
    'reports': 'Financial reports'
  };
  return descriptions[resource] || 'Financial data';
};

const XeroIntegration: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  const navigate = useNavigate();
  
  const {
    state,
    startAuth,
    disconnect,
    refreshConnection,
    refreshToken,
    loadData,
    selectTenant,
    loadSettings,
  } = useXero();

  const {
    tokens,
    tenants,
    selectedTenant,
    settings,
    isLoading,
    error,
    isConnected,
    hasSettings,
    connectionStatus,
  } = state;

  const [selectedResource, setSelectedResource] = useState<XeroResourceType>('invoices');
  const [resourceData, setResourceData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [showDashboard, setShowDashboard] = useState(false);
  const [searchParams] = useSearchParams();

  // Check if user is super admin (should not have access to Xero)
  useEffect(() => {
    if (company?.superadmin) {
      toast.error('Super admins cannot setup Xero integration');
      navigate('/dashboard');
      return;
    }
  }, [company, navigate]);

  // Load settings and check connection status on component mount (only once)
  useEffect(() => {
    console.log('🔄 XeroIntegration: Loading settings and checking connection status...');
    loadSettings();
  }, []); // Remove loadSettings from dependencies to prevent infinite loop

  // Check for showDashboard parameter and automatically show dashboard
  useEffect(() => {
    const showDashboardParam = searchParams.get('showDashboard');
    if (showDashboardParam === 'true' && isConnected) {
      setShowDashboard(true);
    }
  }, [searchParams, isConnected]);

  // Automatically show dashboard when connected
  useEffect(() => {
    if (isConnected && !showDashboard) {
      setShowDashboard(true);
    }
  }, [isConnected, showDashboard]);

  // Automatically select the best tenant when available (prioritize Demo Company Global)
  useEffect(() => {
    if (tenants.length > 0 && !selectedTenant) {
      // Try to find "Demo Company (Global)" first
      const demoCompany = tenants.find(tenant => 
        tenant.name === "Demo Company (Global)" || 
        tenant.organizationName === "Demo Company (Global)" ||
        tenant.tenantName === "Demo Company (Global)"
      );
      
      if (demoCompany) {
        console.log('🔧 Auto-selecting Demo Company (Global):', demoCompany);
        selectTenant(demoCompany.id);
      } else {
        console.log('🔧 Auto-selecting first tenant:', tenants[0]);
        selectTenant(tenants[0].id);
      }
    }
  }, [tenants, selectedTenant, selectTenant]);

  const handleLoadData = async () => {
    if (!isConnected) {
      toast.error('Please connect to Xero first');
      return;
    }

    if (!selectedTenant) {
      toast.error('Please select an organization first');
      return;
    }

    console.log('🔍 Loading data for:', {
      resource: selectedResource,
      tenant: selectedTenant,
      isConnected
    });

    try {
      setIsLoadingData(true);
      const data = await loadData(selectedResource);
      setResourceData(data);
      toast.success(`${selectedResource} loaded successfully`);
    } catch (error: any) {
      console.error('❌ Data loading error:', error);
      toast.error(`Failed to load ${selectedResource}: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    selectTenant(tenantId);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Xero Integration</h1>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading company information...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Xero Integration</h1>
            <div className="flex gap-2">
              {!isConnected && (
                <button
                  onClick={startAuth}
                  disabled={isLoading || !hasSettings}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!hasSettings ? '⚙️ Configure Settings First' : '🔗 Connect to Xero'}
                </button>
              )}
              {isConnected && (
                <>
                  <button
                    onClick={() => setShowDashboard(!showDashboard)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {showDashboard ? '📊 Hide Dashboard' : '📊 Show Dashboard'}
                  </button>
                  <button
                    onClick={disconnect}
                    disabled={isLoading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔌 Disconnect from Xero
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh of connection status...');
                  refreshConnection();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                🔄 Refresh Status
              </button>

            </div>
          </div>

          {/* Organization Selection - Moved to top */}
          {isConnected && tenants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏢 Select Organization</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Available Organizations:</p>
                    <p className="text-xs text-blue-700">Select which Xero organization to access data from</p>
                  </div>
                  <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {tenants.length} organization{tenants.length > 1 ? 's' : ''}
                  </div>
                </div>
                
                <select
                  value={selectedTenant?.id || ''}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {tenants.map((tenant) => {
                    const isDemoCompany = tenant.name === "Demo Company (Global)" || 
                                        tenant.organizationName === "Demo Company (Global)" ||
                                        tenant.tenantName === "Demo Company (Global)";
                    const displayName = tenant.name || tenant.organizationName || tenant.tenantName || `Organization ${tenant.id}`;
                    
                    return (
                      <option key={tenant.id} value={tenant.id}>
                        {isDemoCompany ? `✅ ${displayName} (Has Data)` : `❌ ${displayName} (No Data)`}
                      </option>
                    );
                  })}
                </select>
                
                {selectedTenant && (
                  <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                    {(() => {
                      const isDemoCompany = selectedTenant.name === "Demo Company (Global)" || 
                                          selectedTenant.organizationName === "Demo Company (Global)" ||
                                          selectedTenant.tenantName === "Demo Company (Global)";
                      const displayName = selectedTenant.name || selectedTenant.organizationName || selectedTenant.tenantName || `Organization ${selectedTenant.id}`;
                      
                      return (
                        <div className="text-sm">
                          <p className="text-blue-800">
                            <strong>Selected:</strong> {displayName}
                          </p>
                          <p className={`mt-1 ${isDemoCompany ? 'text-green-600' : 'text-red-600'}`}>
                            {isDemoCompany ? '✅ Has Data (70 invoices, 50 contacts, etc.)' : '❌ No Data (Empty organization)'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tenant ID: {selectedTenant.id}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Xero Dashboard */}
          {showDashboard && isConnected && (
            <div className="mb-8">
              <XeroDashboard />
            </div>
          )}

          {/* Dashboard Available Notice */}
          {isConnected && !showDashboard && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Dashboard Available</h3>
                    <p className="text-blue-700">Your Xero dashboard is ready to view. Click the button to see your financial data.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDashboard(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📊 Show Dashboard
                </button>
              </div>
            </div>
          )}



          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Connection Status Debug */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">🔍 Connection Status Debug</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Backend Connection Status:</strong> {isConnected ? '✅ Connected' : '❌ Not Connected'}</p>
              <p><strong>Has Settings:</strong> {hasSettings ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Is Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
              <p><strong>Connection Status Object:</strong> {connectionStatus ? JSON.stringify(connectionStatus, null, 2) : 'null'}</p>
              <p><strong>Manual Override:</strong> {connectionStatus?.isConnected ? '✅ Backend says Connected' : '❌ Backend says Not Connected'}</p>
            </div>
            {connectionStatus?.isConnected && !isConnected && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                <p className="text-red-800 text-sm font-medium">⚠️ SYNCHRONIZATION ISSUE DETECTED!</p>
                <p className="text-red-700 text-sm">Backend is connected but frontend shows disconnected. Click the button below to fix.</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      console.log('🔧 Manual synchronization fix...');
                      // Force reload settings to sync connection status
                      loadSettings();
                      toast.success('Connection status synchronized');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    🔧 Fix Synchronization
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔧 Force override connection status...');
                      // Force override the connection status based on backend response
                      if (connectionStatus) {
                        // This will trigger a re-render with correct connection status
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                  >
                    🔄 Force Refresh Page
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Xero Settings - Always Visible */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Xero Settings</h2>
            <XeroSettings onSettingsSaved={() => {
              // Reload settings after saving
              loadSettings();
            }} />
          </div>

          {/* Connection Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-green-700 font-medium">Connected to Xero</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={refreshToken}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Refresh Token
                      </button>
                      <button
                        onClick={() => loadSettings()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Check Session
                      </button>
                      <button
                        onClick={startAuth}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Re-authorize
                      </button>
                      <button
                        onClick={disconnect}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        🔌 Disconnect
                      </button>
                    </div>
                  </div>
                  
                  {/* Session Information */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Session Information</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>✅ Session is active and valid</p>
                      <p>🔄 Tokens will be automatically refreshed when needed</p>
                      <p>📊 You can access Xero data without re-authorization</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-red-700 font-medium">
                        Not connected to Xero
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={startAuth}
                        disabled={isLoading || !hasSettings}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {!hasSettings ? 'Configure Settings First' : 'Connect to Xero'}
                      </button>
                      {hasSettings && (
                        <button
                          onClick={() => loadSettings()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Check Connection
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Session Information */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Session Information</h4>
                    <div className="text-sm text-red-700 space-y-1">
                      <p>❌ No active session found</p>
                      <p>🔐 You need to authorize with Xero to access data</p>
                      <p>💾 Once authorized, your session will be saved automatically</p>
                    </div>
                  </div>

                  {/* Connect Button - Prominent */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                    <h4 className="text-lg font-semibold text-indigo-800 mb-3">Ready to Connect?</h4>
                    <p className="text-indigo-700 mb-4">Click the button below to start your Xero integration</p>
                    <button
                      onClick={startAuth}
                      disabled={isLoading || !hasSettings}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {!hasSettings ? '⚙️ Configure Settings First' : '🔗 Connect to Xero Now'}
                    </button>
                    {!hasSettings && (
                      <p className="text-sm text-indigo-600 mt-2">
                        Please configure your Xero settings above before connecting
                      </p>
                    )}
                  </div>

                  {/* Debug Information */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p><strong>Has Settings:</strong> {hasSettings ? 'Yes' : 'No'}</p>
                      <p><strong>Is Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
                      <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                      <p><strong>Has Error:</strong> {error ? 'Yes' : 'No'}</p>
                      {error && <p><strong>Error:</strong> {error}</p>}
                    </div>
                  </div>
                  
                                     {/* Quick Actions */}
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                     <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Actions</h4>
                     <div className="flex gap-2">
                       <button
                         onClick={() => {
                           // Clear any existing tokens and force re-auth
                           localStorage.removeItem('xero_tokens');
                           localStorage.removeItem('xero_auth_start_time');
                           startAuth();
                         }}
                         className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                       >
                         Force Re-authorize
                       </button>
                       <button
                         onClick={() => loadSettings()}
                         className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                       >
                         Reload Settings
                       </button>
                       <button
                         onClick={async () => {
                           console.log('🔍 Manual connection check...');
                           try {
                             await loadSettings();
                             toast.success('Connection status refreshed');
                           } catch (error) {
                             toast.error('Failed to check connection');
                           }
                         }}
                         className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                       >
                         Check Connection Now
                       </button>
                       <button
                         onClick={() => {
                           // Quick retry for expired codes
                           localStorage.removeItem('xero_tokens');
                           localStorage.removeItem('xero_auth_start_time');
                           toast.success('Starting fresh authorization...');
                           startAuth();
                         }}
                         className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                       >
                         Quick Retry
                       </button>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>

                    {/* Data Access */}
          {isConnected && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Xero Data Access</h2>
              
              {!selectedTenant ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-yellow-600 mb-2">⚠️</div>
                  <p className="text-yellow-800 font-medium">Please select an organization above to access Xero data</p>
                </div>
              ) : (
                <div>
                  {/* Available Data Types Overview */}
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-md font-semibold text-blue-900 mb-3">Available Data Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {XERO_RESOURCE_TYPES.map((resource) => (
                    <div key={resource} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <span className="text-blue-600">📋</span>
                      <span className="font-medium">{getResourceDisplayName(resource)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  Click on any data type below to load and view the data from your Xero organization.
                </p>
              </div>
              
              {/* Debug Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 mb-2"><strong>Debug Info:</strong></p>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Selected Tenant:</strong> {selectedTenant ? `${selectedTenant.name || selectedTenant.organizationName || 'Unknown'} (${selectedTenant.id})` : 'None selected'}</p>
                  <p><strong>Available Tenants:</strong> {tenants.length}</p>
                  <p><strong>Resource Type:</strong> {selectedResource}</p>
                  <p><strong>Is Loading:</strong> {isLoadingData ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {/* Quick Access - Most Common Data Types */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3">🚀 Quick Access</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {['invoices', 'contacts', 'bank-transactions', 'accounts'].map((resource) => (
                    <button
                      key={resource}
                      onClick={() => setSelectedResource(resource as XeroResourceType)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedResource === resource
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {getResourceDisplayName(resource)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getResourceDescription(resource)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* All Data Types */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3">📋 All Data Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {XERO_RESOURCE_TYPES.map((resource) => (
                    <button
                      key={resource}
                      onClick={() => setSelectedResource(resource as XeroResourceType)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedResource === resource
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {getResourceDisplayName(resource)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getResourceDescription(resource)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Load Data Button */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={handleLoadData}
                  disabled={isLoadingData}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  {isLoadingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      📊 Load {getResourceDisplayName(selectedResource)}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setResourceData(null);
                    toast.success('Data cleared');
                  }}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Data
                </button>
              </div>

              {/* Data Display */}
              {resourceData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      📊 {getResourceDisplayName(selectedResource)}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(resourceData) ? `${resourceData.length} records` : 'Data loaded'}
                    </div>
                  </div>
                  
                  {/* Data Summary */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <div className="text-sm text-gray-700">
                      <strong>Resource Type:</strong> {getResourceDisplayName(selectedResource)}<br/>
                      <strong>Description:</strong> {getResourceDescription(selectedResource)}<br/>
                      <strong>Data Type:</strong> {Array.isArray(resourceData) ? 'Array' : typeof resourceData}<br/>
                      {Array.isArray(resourceData) && <><strong>Record Count:</strong> {resourceData.length}<br/></>}
                    </div>
                  </div>
                  
                  <XeroDataTable data={resourceData} resourceType={selectedResource} />
                </div>
              )}
                </div>
              )}
            </div>
          )}

          {/* Token Information (for debugging) */}
          {tokens && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Token Type:</span> {tokens.tokenType}
                  </div>
                  <div>
                    <span className="font-medium">Expires In:</span> {tokens.expiresIn} seconds
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Connect Button - Always Visible */}
      {!isConnected && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={startAuth}
            disabled={isLoading || !hasSettings}
            className="px-6 py-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={!hasSettings ? 'Configure Settings First' : 'Connect to Xero'}
          >
            <span className="text-xl">🔗</span>
            <span className="hidden sm:inline">
              {!hasSettings ? 'Configure' : 'Connect'}
            </span>
          </button>
        </div>
      )}
    </SidebarLayout>
  );
};

export default XeroIntegration; 