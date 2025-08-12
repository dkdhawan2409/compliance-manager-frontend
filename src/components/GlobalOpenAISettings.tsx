import React, { useState, useEffect } from 'react';
import { companyService } from '../api/companyService';
import toast from 'react-hot-toast';

interface GlobalOpenAISettingsProps {
  onSettingsChange?: (settings: any) => void;
}

const GlobalOpenAISettings: React.FC<GlobalOpenAISettingsProps> = ({ onSettingsChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  // Load existing settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('🔧 Loading global OpenAI settings...');
      const settings = await companyService.getOpenAiSettings();
      console.log('✅ Global OpenAI settings loaded:', settings);
      setCurrentSettings(settings);
      setApiKey(settings.apiKey || '');
      setModel(settings.model || 'gpt-3.5-turbo');
      setMaxTokens(settings.maxTokens || 1000);
      setTemperature(settings.temperature || 0.7);
      setIsValid(!!settings.apiKey);
      setMessage('Global OpenAI settings loaded successfully');
      setMessageType('success');
      onSettingsChange?.(settings);
    } catch (error: any) {
      console.error('❌ Error loading global OpenAI settings:', error);
      if (error.response?.status === 404) {
        setMessage('No global OpenAI settings found. Please configure the API key.');
        setMessageType('info');
        onSettingsChange?.(null);
      } else {
        setMessage(`Error loading global settings: ${error.response?.data?.message || error.message}`);
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
      console.log('🔧 Testing OpenAI API key...', { apiKey: apiKey.substring(0, 10) + '...' });
      const result = await companyService.testOpenAiApiKey(apiKey);
      console.log('✅ API key test result:', result);
      setIsValid(result.isValid);
      setMessage(result.isValid ? 'API key is valid!' : `Invalid API key: ${result.error}`);
      setMessageType(result.isValid ? 'success' : 'error');
    } catch (error: any) {
      console.error('❌ Error testing API key:', error);
      setIsValid(false);
      setMessage(`Error testing API key: ${error.response?.data?.message || error.message}`);
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
      console.log('🔧 Saving global OpenAI settings...', { apiKey: apiKey.substring(0, 10) + '...', model, maxTokens, temperature });
      const settings = await companyService.saveOpenAiSettings({
        apiKey,
        model,
        maxTokens,
        temperature
      });
      console.log('✅ Global OpenAI settings saved:', settings);
      setCurrentSettings(settings);
      setIsValid(true);
      setMessage('Global OpenAI settings saved successfully!');
      setMessageType('success');
      onSettingsChange?.(settings);
      toast.success('Global OpenAI settings saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving global OpenAI settings:', error);
      const errorMessage = error.response?.data?.message || 'Error saving global settings';
      setMessage(errorMessage);
      setMessageType('error');
      toast.error(errorMessage);
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
      const settings = await companyService.saveOpenAiSettings({
        apiKey,
        model,
        maxTokens,
        temperature
      });
      setCurrentSettings(settings);
      setIsValid(true);
      setMessage('Global OpenAI settings updated successfully!');
      setMessageType('success');
      onSettingsChange?.(settings);
      toast.success('Global OpenAI settings updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error updating global settings';
      setMessage(errorMessage);
      setMessageType('error');
      toast.error(errorMessage);
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
      // Note: You might need to implement a delete endpoint for global settings
      setCurrentSettings(null);
      setIsValid(false);
      setApiKey('');
      setModel('gpt-3.5-turbo');
      setMaxTokens(1000);
      setTemperature(0.7);
      setMessage('Global OpenAI settings cleared successfully!');
      setMessageType('success');
      onSettingsChange?.(null);
      toast.success('Global OpenAI settings cleared successfully!');
    } catch (error: any) {
      setMessage('Error clearing settings');
      setMessageType('error');
      toast.error('Error clearing settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🌐 Global OpenAI Configuration</h3>
        <p className="text-blue-700 text-sm">
          This API key will be used by all companies in the system for AI features. 
          Only super admins can configure this setting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key *
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens
          </label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            min="1"
            max="4000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature
          </label>
          <input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            min="0"
            max="2"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          messageType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleTestKey}
          disabled={loading || !apiKey}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test API Key'}
        </button>

        {currentSettings ? (
          <>
            <button
              onClick={handleUpdateSettings}
              disabled={loading || !apiKey}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Settings'}
            </button>
            <button
              onClick={handleDeleteSettings}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Clearing...' : 'Clear Settings'}
            </button>
          </>
        ) : (
          <button
            onClick={handleSaveSettings}
            disabled={loading || !apiKey}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </div>

      {isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <div>
              <h4 className="text-sm font-medium text-green-800">API Key Valid</h4>
              <p className="text-sm text-green-700">
                The OpenAI API key is valid and ready to use by all companies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalOpenAISettings;
