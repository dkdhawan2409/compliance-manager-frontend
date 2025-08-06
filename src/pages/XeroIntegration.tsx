import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';
import { XERO_RESOURCE_TYPES, type XeroResourceType } from '../api/xeroService';
import { useXero } from '../hooks/useXero';
import XeroDataTable from '../components/XeroDataTable';
import XeroSettings from '../components/XeroSettings';
import toast from 'react-hot-toast';

const XeroIntegration: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  const navigate = useNavigate();
  
  const {
    tokens,
    tenants,
    selectedTenant,
    settings,
    isLoading,
    error,
    isConnected,
    hasSettings,
    startAuth,
    refreshToken,
    loadData,
    selectTenant,
    loadSettings,
  } = useXero();

  const [selectedResource, setSelectedResource] = useState<XeroResourceType>('invoices');
  const [resourceData, setResourceData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check if user is super admin (should not have access to Xero)
  useEffect(() => {
    if (company?.superadmin) {
      toast.error('Super admins cannot setup Xero integration');
      navigate('/dashboard');
      return;
    }
  }, [company, navigate]);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleLoadData = async () => {
    if (!isConnected || !selectedTenant) {
      toast.error('Please connect to Xero first');
      return;
    }

    try {
      setIsLoadingData(true);
      const data = await loadData(selectedResource);
      setResourceData(data);
      toast.success(`${selectedResource} loaded successfully`);
    } catch (error: any) {
      toast.error(`Failed to load ${selectedResource}`);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Xero Integration</h1>

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
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-700 font-medium">Connected to Xero</span>
                  </div>
                  <button
                    onClick={refreshToken}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Refresh Token
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-red-700 font-medium">
                      Not connected to Xero
                    </span>
                  </div>
                  <button
                    onClick={startAuth}
                    disabled={isLoading || !hasSettings}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {!hasSettings ? 'Configure Settings First' : 'Connect to Xero'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tenant Selection */}
          {tenants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Organization</h2>
              <select
                value={selectedTenant?.id || ''}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data Access */}
          {isConnected && selectedTenant && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Access</h2>
              <div className="flex gap-4 mb-4">
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value as XeroResourceType)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {XERO_RESOURCE_TYPES.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLoadData}
                  disabled={isLoadingData}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoadingData ? 'Loading...' : 'Load Data'}
                </button>
              </div>

              {/* Data Display */}
              {resourceData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-2">
                    {selectedResource.charAt(0).toUpperCase() + selectedResource.slice(1).replace('-', ' ')}
                  </h3>
                  <XeroDataTable data={resourceData} resourceType={selectedResource} />
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
    </div>
  );
};

export default XeroIntegration; 