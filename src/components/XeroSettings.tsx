import React, { useState, useEffect } from 'react';
import { useXero } from '../hooks/useXero';
import toast from 'react-hot-toast';

interface XeroSettingsProps {
  onSettingsSaved?: () => void;
}

const XeroSettings: React.FC<XeroSettingsProps> = ({ onSettingsSaved }) => {
  const { settings, hasSettings, loadSettings, saveSettings, deleteSettings, isLoading } = useXero();
  
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        redirectUri: settings.redirectUri,
      });
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted, isEditing:', isEditing);
    
    if (!formData.clientId || !formData.clientSecret || !formData.redirectUri) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await saveSettings(formData);
      console.log('Settings saved, setting isEditing to false');
      setIsEditing(false);
      onSettingsSaved?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete the Xero settings? This will remove your Xero integration configuration.')) {
      try {
        await deleteSettings();
        setFormData({ clientId: '', clientSecret: '', redirectUri: '' });
        setIsEditing(false);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const handleEdit = () => {
    console.log('Edit button clicked, setting isEditing to true');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (settings) {
      setFormData({
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        redirectUri: settings.redirectUri,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Debug logging
  console.log('XeroSettings render:', { hasSettings, isEditing, settings: !!settings });
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Xero Settings {isEditing && <span className="text-sm text-blue-600">(Editing)</span>}
      </h2>
      

      
      {hasSettings && !isEditing && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-700 font-medium">Xero settings configured</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                {settings?.clientId}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                {settings?.redirectUri}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Settings
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Settings
            </button>
          </div>
        </div>
      )}
      
      {(!hasSettings || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditing ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Editing Xero Settings</h3>
              <p className="text-xs text-blue-700">
                Update your company's Xero app credentials below. Changes will be saved when you submit the form.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Company-Specific Configuration</h3>
              <p className="text-xs text-yellow-700">
                Each company must configure their own Xero app credentials. Do not use shared or static credentials.
              </p>
            </div>
          )}
          
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Xero Client ID *
            </label>
            <input
              type="text"
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your Xero Client ID"
              required
            />
          </div>
          
          <div>
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
              Xero Client Secret *
            </label>
            <input
              type="password"
              id="clientSecret"
              name="clientSecret"
              value={formData.clientSecret}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your Xero Client Secret"
              required
            />
          </div>
          
          <div>
            <label htmlFor="redirectUri" className="block text-sm font-medium text-gray-700 mb-1">
              Redirect URI *
            </label>
            <input
              type="url"
              id="redirectUri"
              name="redirectUri"
              value={formData.redirectUri}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://compliance-manager-frontend.onrender.com/redirecturl"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Set this to: <code className="bg-gray-100 px-1 rounded">https://compliance-manager-frontend.onrender.com/redirecturl</code>
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How to get Xero credentials:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Go to <a href="https://developer.xero.com" target="_blank" rel="noopener noreferrer" className="underline">Xero Developer Portal</a></li>
              <li>2. Create a new app for your company</li>
              <li>3. Copy the Client ID and Client Secret</li>
              <li>4. Set the Redirect URI to: <code className="bg-blue-100 px-1 rounded">https://compliance-manager-frontend.onrender.com/redirecturl</code></li>
              <li>5. Enter your company's specific credentials below</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> Each company must use their own Xero app credentials. Do not use shared or static credentials.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Settings' : 'Save Settings')}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default XeroSettings; 