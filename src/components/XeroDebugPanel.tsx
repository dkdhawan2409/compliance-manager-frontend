import React, { useState, useEffect } from 'react';
import { getRenderRedirectUri, getCurrentDomain } from '../utils/envChecker';
import apiClient from '../api/client';

const XeroDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebugCheck = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current environment info
      const currentDomain = getCurrentDomain();
      const renderRedirectUri = getRenderRedirectUri();
      const windowLocation = window.location.href;
      const hostname = window.location.hostname;
      const isProduction = import.meta.env.PROD;
      
      // Test backend response
      const redirectUri = getRenderRedirectUri();
      const state = Math.random().toString(36).substring(2, 15);
      
      console.log('🔍 DEBUG - Testing backend with redirect URI:', redirectUri);
      
      const response = await apiClient.get('/xero/login', {
        params: { redirect_uri: redirectUri, state: state }
      });
      
      const authUrl = response.data.data?.authUrl;
      
      setDebugInfo({
        environment: {
          currentDomain,
          renderRedirectUri,
          windowLocation,
          hostname,
          isProduction,
          viteFrontendUrl: import.meta.env.VITE_FRONTEND_URL,
          viteApiUrl: import.meta.env.VITE_API_URL
        },
        backend: {
          redirectUriSent: redirectUri,
          stateSent: state,
          authUrlReceived: authUrl,
          responseData: response.data
        },
        analysis: {
          authUrlContainsLocalhost: authUrl?.includes('localhost') || false,
          authUrlContainsRender: authUrl?.includes('compliance-manager-frontend.onrender.com') || false,
          redirectUriMatches: authUrl?.includes(redirectUri) || false
        }
      });
      
    } catch (err: any) {
      setError(err.message || 'Debug check failed');
      console.error('Debug check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDebugCheck();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🔍 Xero OAuth Debug Panel</h3>
        <button
          onClick={runDebugCheck}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Running...' : 'Refresh Debug'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {debugInfo && (
        <div className="space-y-4">
          {/* Environment Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">🌍 Environment Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><strong>Current Domain:</strong> {debugInfo.environment.currentDomain}</div>
              <div><strong>Render Redirect URI:</strong> {debugInfo.environment.renderRedirectUri}</div>
              <div><strong>Window Location:</strong> {debugInfo.environment.windowLocation}</div>
              <div><strong>Hostname:</strong> {debugInfo.environment.hostname}</div>
              <div><strong>Is Production:</strong> {debugInfo.environment.isProduction ? 'Yes' : 'No'}</div>
              <div><strong>VITE_FRONTEND_URL:</strong> {debugInfo.environment.viteFrontendUrl || 'Not set'}</div>
              <div><strong>VITE_API_URL:</strong> {debugInfo.environment.viteApiUrl || 'Not set'}</div>
            </div>
          </div>

          {/* Backend Communication */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">🔗 Backend Communication</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Redirect URI Sent:</strong> {debugInfo.backend.redirectUriSent}</div>
              <div><strong>State Sent:</strong> {debugInfo.backend.stateSent}</div>
              <div><strong>Auth URL Received:</strong> 
                <div className="mt-1 p-2 bg-white border rounded text-xs break-all">
                  {debugInfo.backend.authUrlReceived || 'No auth URL received'}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">🔍 Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center ${debugInfo.analysis.authUrlContainsLocalhost ? 'text-red-600' : 'text-green-600'}`}>
                <span className="mr-2">{debugInfo.analysis.authUrlContainsLocalhost ? '❌' : '✅'}</span>
                <strong>Auth URL contains localhost:</strong> {debugInfo.analysis.authUrlContainsLocalhost ? 'YES (PROBLEM!)' : 'No'}
              </div>
              <div className={`flex items-center ${debugInfo.analysis.authUrlContainsRender ? 'text-green-600' : 'text-red-600'}`}>
                <span className="mr-2">{debugInfo.analysis.authUrlContainsRender ? '✅' : '❌'}</span>
                <strong>Auth URL contains Render domain:</strong> {debugInfo.analysis.authUrlContainsRender ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center ${debugInfo.analysis.redirectUriMatches ? 'text-green-600' : 'text-red-600'}`}>
                <span className="mr-2">{debugInfo.analysis.redirectUriMatches ? '✅' : '❌'}</span>
                <strong>Redirect URI matches:</strong> {debugInfo.analysis.redirectUriMatches ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {/* Xero App Configuration */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">⚙️ Xero App Configuration Required</h4>
            <div className="space-y-2 text-sm">
              <p className="text-purple-800">Your Xero app must have this EXACT redirect URI:</p>
              <div className="p-2 bg-white border rounded font-mono text-xs break-all">
                {debugInfo.environment.renderRedirectUri}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(debugInfo.environment.renderRedirectUri);
                  alert('Redirect URI copied to clipboard!');
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
              >
                📋 Copy Redirect URI
              </button>
            </div>
          </div>

          {/* Raw Response */}
          <details className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <summary className="font-semibold text-gray-900 cursor-pointer">📄 Raw Backend Response</summary>
            <pre className="mt-2 text-xs bg-white p-2 border rounded overflow-auto">
              {JSON.stringify(debugInfo.backend.responseData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default XeroDebugPanel;
