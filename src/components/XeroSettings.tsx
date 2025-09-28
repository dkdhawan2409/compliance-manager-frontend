import React, { useState, useEffect } from 'react';
import { useXero } from '../integrations/xero/context/XeroProvider';
import { logEnvironmentInfo, getCurrentDomain, getApiUrl, getRenderRedirectUri } from '../utils/envChecker';
import toast from 'react-hot-toast';

const XeroSettings: React.FC<{ onSettingsSaved?: () => void }> = ({ onSettingsSaved }) => {
  const { settings, isLoading, error, saveSettings, loadSettings } = useXero();
  
  const [formData, setFormData] = useState({
    accessToken: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        accessToken: settings.accessToken || ''
      });
    }
  }, [settings]);

  // Load settings from backend API on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accessToken.trim()) {
      toast.error('Please enter your Xero access token');
      return;
    }

    try {
      // Save the access token directly
      const settingsData = {
        accessToken: formData.accessToken.trim()
      };
      
      console.log('🔧 Saving Xero access token');
      await saveSettings(settingsData);
      onSettingsSaved?.();
      toast.success('Xero token saved successfully!');
    } catch (error) {
      console.error('Failed to save token:', error);
      toast.error('Failed to save Xero token');
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
        <h3 className="text-lg font-semibold text-gray-900">Simple Xero Authentication</h3>
      </div>


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-1">
            Xero Access Token *
          </label>
          <input
            type="password"
            id="accessToken"
            value={formData.accessToken}
            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your Xero access token"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your Xero app in the developer portal - much simpler than OAuth!
          </p>
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
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">🚀 Simple Setup Instructions</h4>
        <ol className="text-sm text-green-800 space-y-1">
          <li>1. Go to <a href="https://developer.xero.com/" target="_blank" rel="noopener noreferrer" className="underline">Xero Developer Portal</a></li>
          <li>2. Create a new app or select an existing one</li>
          <li>3. Go to "My Apps" → Select your app → "Configuration"</li>
          <li>4. Generate a new access token</li>
          <li>5. Copy the token and paste it above</li>
          <li>6. Click "Save Settings" - you're connected instantly!</li>
        </ol>
        <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded">
          <p className="text-green-800 text-xs">
            <strong>✅ Benefits:</strong> No Client ID/Secret needed, no redirect URI setup, no OAuth flow complexity!
          </p>
        </div>
      </div>
    </div>
  );
};

export default XeroSettings; 