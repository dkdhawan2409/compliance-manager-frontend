import React, { useState, useEffect } from 'react';
import { useXero } from '../contexts/XeroContext';
import { useAuth } from '../contexts/AuthContext';
import { getXeroAuthUrl, handleXeroCallback } from '../api/xeroService';
import toast from 'react-hot-toast';

interface XeroFlowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: string;
}

const XeroFlowManagerOriginal: React.FC = () => {
  const { state, startAuth, handleCallback, disconnect, loadSettings, refreshConnection, selectTenant, clearError } = useXero();
  const { isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const { isConnected, hasSettings, selectedTenant, tenants, connectionStatus, error, isLoading } = state;

  // Define the flow steps
  const flowSteps: XeroFlowStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started with Xero integration',
      status: isAuthenticated ? 'completed' : 'current',
      icon: '👋'
    },
    {
      id: 'connect',
      title: 'Connect to Xero',
      description: 'Authorize your Xero account',
      status: isConnected ? 'completed' : (hasSettings ? 'current' : 'pending'),
      icon: '🔗'
    },
    {
      id: 'organization',
      title: 'Select Organization',
      description: 'Choose your Xero organization',
      status: selectedTenant ? 'completed' : (isConnected && tenants?.length > 0 ? 'current' : 'pending'),
      icon: '🏢'
    },
    {
      id: 'data',
      title: 'Access Your Data',
      description: 'Load and view your Xero data',
      status: selectedTenant ? 'current' : 'pending',
      icon: '📊'
    }
  ];

  // Update current step based on progress
  useEffect(() => {
    const completedSteps = flowSteps.filter(step => step.status === 'completed').length;
    setCurrentStep(completedSteps);
  }, [isConnected, hasSettings, selectedTenant, tenants, isAuthenticated]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (code && state) {
      handleCallback(code, state);
    } else if (error) {
      toast.error(`OAuth error: ${error}`);
    }
  }, [handleCallback]);

  const handleConnect = async () => {
    try {
      await startAuth();
    } catch (error: any) {
      toast.error(error.message || 'Failed to start Xero connection');
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Xero Integration</h1>
        <p className="text-gray-600">Connect your Xero account in just a few simple steps</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Setup Progress</h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600">
            {currentStep} of {flowSteps.length} completed
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / flowSteps.length) * 100}%` }}
          ></div>
        </div>

        <div className="text-center">
          {currentStep === flowSteps.length ? (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600 font-semibold">🎉 Integration Complete!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-600">Next step:</span>
              <span className="font-semibold text-blue-600">{flowSteps[currentStep]?.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Flow Steps */}
      <div className="space-y-6">
        {flowSteps.map((step, index) => (
          <div
            key={step.id}
            className={`bg-white rounded-lg shadow-md p-6 transition-all duration-300 ${
              step.status === 'current' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`text-3xl ${step.status === 'completed' ? 'opacity-100' : 'opacity-50'}`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    step.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : step.status === 'current'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {step.status === 'completed' ? 'Completed' : step.status === 'current' ? 'Current' : 'Pending'}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{step.description}</p>
              </div>
            </div>

            {/* Step-specific content */}
            {step.id === 'connect' && step.status === 'current' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Continue →'}
                </button>
              </div>
            )}

            {step.id === 'organization' && step.status === 'current' && tenants && tenants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Available Organizations:</h4>
                <div className="space-y-2">
                  {tenants.map((tenant: any) => (
                    <button
                      key={tenant.id}
                      onClick={() => handleSelectTenant(tenant.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{tenant.name || tenant.organizationName}</div>
                      <div className="text-sm text-gray-600">ID: {tenant.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step.id === 'data' && step.status === 'current' && selectedTenant && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-3">Ready to Access Your Data</h4>
                  <p className="text-gray-600 mb-4">You can now load and view your Xero data</p>
                  <button
                    onClick={handleLoadData}
                    className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📊 Load My Data
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
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
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
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
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-2xl mb-2">🔌</div>
              <div className="font-medium text-gray-900">Disconnect</div>
            </button>
          )}
        </div>
      </div>

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
              <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>Has Settings: {hasSettings ? 'Yes' : 'No'}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Selected Tenant: {selectedTenant?.name || selectedTenant?.organizationName || 'none'}</div>
              <div>Tenants: {tenants?.length || 0}</div>
              <div>Connection Status: {connectionStatus || 'none'}</div>
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

export default XeroFlowManagerOriginal;
