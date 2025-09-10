import React, { useState, useEffect } from 'react';
import { useXero } from '../hooks/useXero';
import { logEnvironmentInfo, getCurrentDomain, getApiUrl } from '../utils/envChecker';
import toast from 'react-hot-toast';

const XeroSettings: React.FC<{ onSettingsSaved?: () => void }> = ({ onSettingsSaved }) => {
  const { settings, isLoading, error, saveSettings, loadSettings } = useXero();
  
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: getCurrentDomain() + '/redirecturl'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        clientId: settings.clientId || '',
        clientSecret: '',
        redirectUri: settings.redirectUri || getCurrentDomain() + '/redirecturl'
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.clientSecret) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await saveSettings(formData);
      onSettingsSaved?.();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      console.log('🧪 Testing Xero connection...');
      logEnvironmentInfo();
      
      // Test backend connectivity using API client instead of hardcoded URL
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/health`);
      const healthData = await response.json();
      console.log('🏥 Backend health:', healthData);
      
      // Test OAuth endpoint
      const token = localStorage.getItem('token');
      if (token) {
        const oauthResponse = await fetch(`${apiUrl}/xero/login`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('🔐 OAuth endpoint status:', oauthResponse.status);
        if (oauthResponse.ok) {
          const oauthData = await oauthResponse.json();
          console.log('🔐 OAuth endpoint response:', oauthData);
        }
      }
      
      toast.success('Connection test completed. Check console for details.');
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      toast.error('Connection test failed. Check console for details.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Xero OAuth Configuration</h3>
      </div>


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Xero Client ID *
          </label>
          <input
            type="text"
            id="clientId"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your Xero Client ID"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your Xero app in the developer portal
          </p>
        </div>

        <div>
          <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
            Xero Client Secret *
          </label>
          <input
            type="password"
            id="clientSecret"
            value={formData.clientSecret}
            onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your Xero Client Secret"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your Xero app in the developer portal
          </p>
        </div>

        <div>
          <label htmlFor="redirectUri" className="block text-sm font-medium text-gray-700 mb-1">
            Redirect URI
          </label>
          <input
            type="url"
            id="redirectUri"
            value={formData.redirectUri}
            onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={getCurrentDomain() + '/redirecturl'}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must match the redirect URI configured in your Xero app
          </p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <p className="text-blue-800 font-medium">Current Domain Detection:</p>
            <p className="text-blue-700">Domain: {getCurrentDomain()}</p>
            <p className="text-blue-700">Environment: {import.meta.env.PROD ? 'Production' : 'Development'}</p>
            <p className="text-blue-700">VITE_FRONTEND_URL: {import.meta.env.VITE_FRONTEND_URL || 'Not set'}</p>
            <p className="text-blue-700">Generated Redirect URI: {getCurrentDomain()}/redirecturl</p>
            <div className="mt-2">
              <button
                onClick={() => {
                  const redirectUri = `${getCurrentDomain()}/redirecturl`;
                  navigator.clipboard.writeText(redirectUri);
                  toast.success('Redirect URI copied to clipboard!');
                }}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                📋 Copy Redirect URI
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            type="button"
            onClick={loadSettings}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Reload Settings
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📋 Setup Instructions</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Create a Xero app in the <a href="https://developer.xero.com/" target="_blank" rel="noopener noreferrer" className="underline">Xero Developer Portal</a></li>
          <li>2. Set the redirect URI to: <code className="bg-blue-100 px-1 rounded">{getCurrentDomain()}/redirecturl</code></li>
          <li>3. Copy your Client ID and Client Secret</li>
          <li>4. Save the settings above</li>
          <li>5. Test the connection by saving the settings</li>
        </ol>
      </div>
    </div>
  );
};

export default XeroSettings; 