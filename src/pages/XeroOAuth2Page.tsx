import React, { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import XeroOAuth2Integration from '../components/XeroOAuth2Integration';
import XeroIntegrationSimplified from '../components/XeroIntegrationSimplified';
import ProductionDiagnostic from '../components/ProductionDiagnostic';

const XeroOAuth2Page: React.FC = () => {
  const [useSimplified, setUseSimplified] = useState(true); // Default to simplified version

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔗 Xero OAuth2 Integration
          </h1>
          <p className="text-gray-600">
            Professional OAuth2 integration following Xero's recommended flow
          </p>
        </div>

        {/* Version Toggle */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Integration Version</h3>
              <p className="text-sm text-gray-600">
                {useSimplified ? 'Using simplified version (bypasses backend issues)' : 'Using full backend integration'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setUseSimplified(true)}
                className={`px-4 py-2 text-sm rounded-md ${
                  useSimplified 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✅ Simplified (Works!)
              </button>
              <button
                onClick={() => setUseSimplified(false)}
                className={`px-4 py-2 text-sm rounded-md ${
                  !useSimplified 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔧 Full Integration
              </button>
            </div>
          </div>
        </div>

        {/* Integration Component */}
        {useSimplified ? (
          <XeroIntegrationSimplified />
        ) : (
          <XeroOAuth2Integration />
        )}

        {/* Production Diagnostic Tool */}
        <div className="mt-8">
          <ProductionDiagnostic />
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">🎯 OAuth2 Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-800 mb-2">✅ What Happens:</h3>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>Click "Connect to Xero"</li>
                <li>Redirect to Xero login</li>
                <li>Grant permissions</li>
                <li>Return with authorization code</li>
                <li>Exchange code for tokens</li>
                <li>Access your Xero data</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-green-800 mb-2">🔒 Security Features:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Industry-standard OAuth2</li>
                <li>• CSRF protection with state</li>
                <li>• Automatic token refresh</li>
                <li>• Secure token storage</li>
                <li>• Multi-tenant support</li>
              </ul>
            </div>
          </div>
        </div>

        {useSimplified ? (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-4">⚡ Simplified Integration</h2>
            <div className="space-y-3 text-yellow-800">
              <p><strong>This version bypasses backend issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ No "Failed to fetch" errors</li>
                <li>✅ Direct OAuth2 connection to Xero</li>
                <li>✅ Works even if backend is down</li>
                <li>✅ Demo data available without connection</li>
                <li>✅ Simplified error handling</li>
                <li>✅ Immediate connection feedback</li>
              </ul>
              <p className="text-sm mt-3">
                <strong>Note:</strong> This version works independently of backend status. Perfect for testing and immediate use!
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">⚙️ Administrator Setup</h2>
            <div className="space-y-3 text-blue-800">
              <p><strong>For Administrators:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to <a href="https://developer.xero.com/" target="_blank" rel="noopener noreferrer" className="underline">developer.xero.com</a></li>
                <li>Create or select your Xero app</li>
                <li>Copy the Client ID and Client Secret</li>
                <li>Configure backend environment variables</li>
                <li>Set up CORS configuration</li>
              </ol>
              <p className="text-sm mt-3">
                <strong>Note:</strong> Full integration requires proper backend setup to avoid "Failed to fetch" errors.
              </p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default XeroOAuth2Page;
