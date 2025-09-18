import React from 'react';
import SidebarLayout from '../components/SidebarLayout';
import XeroAdminManager from '../components/XeroAdminManager';

const AdminXeroManager: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛠️ Xero Admin Management
          </h1>
          <p className="text-gray-600">
            Manage Xero OAuth2 client credentials for all companies
          </p>
        </div>

        <XeroAdminManager />

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ How This Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🔐 OAuth2 Flow:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Company clicks "Connect to Xero"</li>
                <li>System uses assigned client credentials</li>
                <li>User authorizes on Xero's website</li>
                <li>Tokens are securely stored per company</li>
                <li>Company can access their Xero data</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">🎯 Benefits:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Centralized credential management</li>
                <li>• Secure per-company isolation</li>
                <li>• Easy bulk configuration</li>
                <li>• Proper OAuth2 compliance</li>
                <li>• No manual setup required by users</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AdminXeroManager;
