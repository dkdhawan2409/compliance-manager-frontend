import React from 'react';
import SidebarLayout from '../components/SidebarLayout';
import XeroOAuth2Integration from '../components/XeroOAuth2Integration';

const XeroOAuth2Page: React.FC = () => {
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

        <XeroOAuth2Integration />

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

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">⚙️ Administrator Setup</h2>
          <div className="space-y-3 text-blue-800">
            <p><strong>For Administrators:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to <a href="https://developer.xero.com/" target="_blank" rel="noopener noreferrer" className="underline">developer.xero.com</a></li>
              <li>Create or select your Xero app</li>
              <li>Copy the Client ID and Client Secret</li>
              <li>Go to <strong>🔗 Xero Admin</strong> in the admin panel</li>
              <li>Assign credentials to companies</li>
            </ol>
            <p className="text-sm mt-3">
              <strong>Note:</strong> Companies can only connect after an administrator configures their Xero credentials.
            </p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default XeroOAuth2Page;
