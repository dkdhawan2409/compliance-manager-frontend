import React, { useState, useEffect } from 'react';
import openAIService, { OpenAISettingsData, OpenAISettingsInput } from '../api/openaiService';

interface OpenAISettingsProps {
  onSettingsChange?: (settings: OpenAISettingsData | null) => void;
}

const OpenAISettings: React.FC<OpenAISettingsProps> = ({ onSettingsChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentSettings, setCurrentSettings] = useState<OpenAISettingsData | null>(null);
  // Load existing settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await openAIService.getSettings();
      setCurrentSettings(settings);
      setIsValid(settings.isActive);
      setMessage('OpenAI settings loaded successfully');
      setMessageType('success');
      onSettingsChange?.(settings);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMessage('No OpenAI settings found. Please configure your API key.');
        setMessageType('info');
        onSettingsChange?.(null);
      } else {
        setMessage('Error loading settings');
        setMessageType('error');
      }
    }
  };

  const handleTestKey = async () => {
    if (!apiKey) {
      setMessage('Please enter an API key');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const result = await openAIService.testApiKey(apiKey);
      setIsValid(result.isValid);
      setMessage(result.isValid ? 'API key is valid!' : `Invalid API key: ${result.error}`);
      setMessageType(result.isValid ? 'success' : 'error');
    } catch (error: any) {
      setIsValid(false);
      setMessage('Error testing API key');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!apiKey) {
      setMessage('Please enter an API key');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const settings = await openAIService.saveSettings({ apiKey });
      setCurrentSettings(settings);
      setIsValid(true);
      setMessage('Settings saved successfully!');
      setMessageType('success');
      onSettingsChange?.(settings);
    } catch (error: any) {
      setMessage('Error saving settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!apiKey || !currentSettings) {
      setMessage('Please enter an API key and ensure settings exist');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const settings = await openAIService.updateSettings(currentSettings.id, { apiKey });
      setCurrentSettings(settings);
      setIsValid(true);
      setMessage('Settings updated successfully!');
      setMessageType('success');
      onSettingsChange?.(settings);
    } catch (error: any) {
      setMessage('Error updating settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSettings = async () => {
    if (!currentSettings) {
      setMessage('No settings to delete');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      await openAIService.deleteSettings(currentSettings.id);
      setCurrentSettings(null);
      setIsValid(false);
      setApiKey('');
      setMessage('Settings deleted successfully!');
      setMessageType('success');
      onSettingsChange?.(null);
    } catch (error: any) {
      setMessage('Error deleting settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getMessageClass = () => {
    switch (messageType) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="openai-settings bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">OpenAI Settings</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              onClick={handleTestKey}
              disabled={!apiKey || loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test'}
            </button>
          </div>
        </div>

        {currentSettings && (
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Settings</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Status: <span className={`font-medium ${currentSettings.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {currentSettings.isActive ? 'Active' : 'Inactive'}
              </span></div>
              <div>Created: {new Date(currentSettings.createdAt).toLocaleDateString()}</div>
              <div>Updated: {new Date(currentSettings.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Security Information</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• API key is stored securely on the server</p>
            <p>• Test your key before saving to ensure it's valid</p>
            <p>• You can update or delete settings at any time</p>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          {currentSettings ? (
            <>
              <button
                onClick={handleUpdateSettings}
                disabled={!apiKey || !isValid || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Settings'}
              </button>
              <button
                onClick={handleDeleteSettings}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Settings'}
              </button>
            </>
          ) : (
            <button
              onClick={handleSaveSettings}
              disabled={!apiKey || !isValid || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </div>
        
        {message && (
          <div className={`p-3 rounded-md border ${getMessageClass()}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenAISettings; 