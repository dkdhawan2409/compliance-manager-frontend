import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import XeroOAuth2Integration from '../components/XeroOAuth2Integration';
import toast from 'react-hot-toast';

const XeroIntegration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const integrationRef = useRef<any>(null);

  // Handle OAuth callback success/error messages
  useEffect(() => {
    const success = searchParams.get('success');
    const autoload = searchParams.get('autoload');
    const tenantCount = searchParams.get('tenant_count');
    const error = searchParams.get('error');
    
    if (success === 'connected') {
      const message = tenantCount === '1' 
        ? '🎉 Successfully connected to Xero! Auto-loading all your data...'
        : `🎉 Successfully connected to Xero! Found ${tenantCount} organizations. Loading data...`;
      
      toast.success(message);
      
      // Auto-load comprehensive data after successful connection
      if (autoload === 'true') {
        console.log('🚀 OAuth callback triggered comprehensive data loading...');
        setTimeout(() => {
          if (integrationRef.current?.loadComprehensiveData) {
            integrationRef.current.loadComprehensiveData();
          }
        }, 2000); // Give time for the component to initialize and tokens to be processed
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      const errorMessages = {
        oauth_denied: 'OAuth authorization was denied',
        missing_parameters: 'Missing authorization parameters',
        invalid_state: 'Invalid or expired authorization state',
        oauth_failed: 'OAuth flow failed',
        invalid_grant: 'Authorization code expired',
        invalid_client: 'Invalid Xero app configuration',
        missing_credentials: 'Xero credentials not configured'
      };
      toast.error(`❌ ${errorMessages[error as keyof typeof errorMessages] || `Connection failed: ${error}`}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔗 Xero Integration
          </h1>
          <p className="text-gray-600">
            Connect to Xero and access all your business data with comprehensive tools
          </p>
        </div>

        {/* Temporarily use simplified display for guaranteed working data */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 Working Xero Data Display</h3>
          <p className="text-blue-700 text-sm mb-3">
            This simplified display bypasses state management issues and directly shows Xero data.
          </p>
          <a 
            href="/xero/data-display"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📊 View Working Xero Data Display
          </a>
        </div>
        
        <XeroOAuth2Integration ref={integrationRef} />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">🚀 Complete Xero Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">📊 Access All Data:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 📄 Invoices & Bills</li>
                <li>• 👥 Contacts & Suppliers</li>
                <li>• 🏦 Chart of Accounts</li>
                <li>• 💳 Bank Transactions</li>
                <li>• 📦 Items & Services</li>
                <li>• 🧾 Receipts & Expenses</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">⚡ Advanced Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 🔍 Search & Filter Data</li>
                <li>• 📥 Export to JSON</li>
                <li>• 🚀 Bulk Data Loading</li>
                <li>• 📋 Table Preview</li>
                <li>• 🔄 Real-time Updates</li>
                <li>• 📊 Summary Statistics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">🔒 Enterprise Ready:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 🛡️ Secure OAuth2 Flow</li>
                <li>• 🏢 Multi-tenant Support</li>
                <li>• 🔄 Auto Token Refresh</li>
                <li>• 📱 Mobile Responsive</li>
                <li>• ⚡ High Performance</li>
                <li>• 🔧 Easy Management</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">💡 Getting Started</h2>
          <div className="space-y-3 text-yellow-800">
            <p><strong>First Time Setup:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Your administrator configures Xero credentials</li>
              <li>Click "🔗 Authorize with Xero" to connect</li>
              <li>Grant permissions on Xero's website</li>
              <li>Return here to access your data</li>
              <li>Use quick actions or load specific data types</li>
              <li>Search, filter, and export as needed</li>
            </ol>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default XeroIntegration;