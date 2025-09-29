import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/envChecker';

interface XeroCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface Company {
  id: number;
  companyName: string;
  hasXeroSettings?: boolean;
}

const XeroAdminManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<XeroCredentials>({
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/redirecturl'
  });
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadExistingCredentials();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/companies/admin/all-with-xero`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const loadExistingCredentials = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/xero-plug-play/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.client_id) {
          // Auto-fill the form with existing credentials
          setCredentials({
            clientId: data.data.client_id,
            clientSecret: data.data.client_secret || '', // Show the actual client secret
            redirectUri: data.data.redirect_uri || window.location.origin + '/redirecturl'
          });
          console.log('✅ Auto-filled existing Xero credentials');
        }
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    }
  };

  const handleAssignCredentials = async () => {
    if (!selectedCompany || !credentials.clientId) {
      toast.error('Please select a company and provide a Client ID');
      return;
    }
    
    if (!credentials.clientSecret) {
      toast.error('Please provide a Client Secret');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/companies/admin/${selectedCompany}/xero-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Xero credentials assigned successfully!');
        setCredentials({
          clientId: '',
          clientSecret: '',
          redirectUri: window.location.origin + '/redirecturl'
        });
        setSelectedCompany(null);
        loadCompanies(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to assign credentials');
      }
    } catch (error: any) {
      console.error('Error assigning credentials:', error);
      toast.error('Failed to assign credentials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!credentials.clientId) {
      toast.error('Please provide a Client ID');
      return;
    }
    
    if (!credentials.clientSecret) {
      toast.error('Please provide a Client Secret');
      return;
    }

    setBulkLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/companies/admin/xero-client-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Xero credentials assigned to ${data.updatedCount} companies!`);
        setCredentials({
          clientId: '',
          clientSecret: '',
          redirectUri: window.location.origin + '/redirecturl'
        });
        loadCompanies(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to bulk assign credentials');
      }
    } catch (error: any) {
      console.error('Error bulk assigning credentials:', error);
      toast.error('Failed to bulk assign credentials: ' + error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔗 Xero OAuth2 Management</h2>
        <p className="text-gray-600">
          Assign Xero client credentials to companies for OAuth2 integration
        </p>
      </div>

      {/* Credentials Form */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Xero OAuth2 Credentials</h3>
          <button
            onClick={loadExistingCredentials}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            🔄 Refresh Credentials
          </button>
        </div>
        {credentials.clientId && (
          <p className="text-sm text-green-600 mt-1">
            ✅ Auto-filled from saved settings
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Xero Client ID *
          </label>
          <input
            type="text"
            value={credentials.clientId}
            onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Xero Client ID (UUID format)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Xero Client Secret *
          </label>
          <input
            type="text"
            value={credentials.clientSecret}
            onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Xero Client Secret"
          />
          {credentials.clientId && credentials.clientSecret && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Client secret loaded from saved settings.
            </p>
          )}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Redirect URI
          </label>
          <input
            type="text"
            value={credentials.redirectUri}
            onChange={(e) => setCredentials({ ...credentials, redirectUri: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="OAuth callback URL"
          />
        </div>
      </div>

      {/* Individual Assignment */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">👤 Assign to Specific Company</h3>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Company
            </label>
            <select
              value={selectedCompany || ''}
              onChange={(e) => setSelectedCompany(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName} {company.hasXeroSettings ? '✅' : '❌'}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleAssignCredentials}
            disabled={loading || !selectedCompany}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>

      {/* Save Credentials */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-4">💾 Save Xero Credentials</h3>
        
        <div className="flex justify-between items-center">
          <p className="text-green-700">
            Save these credentials for all companies. New companies will automatically use these credentials.
          </p>
          
          <button
            onClick={handleBulkAssign}
            disabled={bulkLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkLoading ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">📋 Setup Instructions</h3>
        <ol className="list-decimal list-inside text-yellow-800 space-y-1">
          <li>Go to <a href="https://developer.xero.com/" target="_blank" rel="noopener noreferrer" className="underline">developer.xero.com</a></li>
          <li>Create or select your Xero app</li>
          <li>Copy the Client ID and Client Secret</li>
          <li>Set the redirect URI to: <code className="bg-yellow-100 px-1 rounded">{window.location.origin}/redirecturl</code></li>
          <li>Click "Save Credentials" to apply to all companies</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>💡 Auto-apply:</strong> Saved credentials will automatically be used by all existing companies and any new companies that are created.
          </p>
        </div>
      </div>
    </div>
  );
};

export default XeroAdminManager;
