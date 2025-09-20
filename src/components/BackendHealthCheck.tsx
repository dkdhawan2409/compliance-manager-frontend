import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { getApiUrl } from '../utils/envChecker';

const BackendHealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const checkBackendHealth = async () => {
    setHealthStatus('checking');
    setError(null);
    
    try {
      // Test basic health endpoint
      const healthResponse = await fetch(`${getApiUrl().replace('/api', '')}/health`);
      const healthData = await healthResponse.json();
      
      // Test Xero settings endpoint
      const xeroResponse = await apiClient.get('/xero/settings');
      
      setResponse({
        health: healthData,
        xeroSettings: xeroResponse.data
      });
      
      setHealthStatus('healthy');
    } catch (err: any) {
      setError(err.message);
      setHealthStatus('unhealthy');
      console.error('Backend health check failed:', err);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">🏥 Backend Health Check</h3>
        <button
          onClick={checkBackendHealth}
          disabled={healthStatus === 'checking'}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {healthStatus === 'checking' ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <span className="mr-2">
            {healthStatus === 'checking' && '⏳'}
            {healthStatus === 'healthy' && '✅'}
            {healthStatus === 'unhealthy' && '❌'}
          </span>
          <span className={`font-medium ${
            healthStatus === 'healthy' ? 'text-green-600' : 
            healthStatus === 'unhealthy' ? 'text-red-600' : 
            'text-yellow-600'
          }`}>
            Backend Status: {healthStatus === 'checking' ? 'Checking...' : healthStatus === 'healthy' ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-700">View Response Details</summary>
            <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default BackendHealthCheck;
