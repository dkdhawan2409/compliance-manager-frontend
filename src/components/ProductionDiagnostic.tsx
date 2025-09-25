import React, { useState } from 'react';
import { getApiUrl } from '../utils/envChecker';
import toast from 'react-hot-toast';

const ProductionDiagnostic: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const results: any = {};

    // Test 1: Environment variables
    results.environment = {
      isProd: import.meta.env.PROD,
      mode: import.meta.env.MODE,
      viteApiUrl: import.meta.env.VITE_API_URL,
      calculatedApiUrl: getApiUrl(),
      currentDomain: window.location.origin
    };

    // Test 2: Authentication token
    const token = localStorage.getItem('token');
    results.auth = {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    };

    // Test 3: Basic connectivity (no auth)
    try {
      const basicResponse = await fetch(`${getApiUrl()}/api/xero/demo/organization`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      results.basicConnectivity = {
        status: basicResponse.status,
        statusText: basicResponse.statusText,
        ok: basicResponse.ok,
        headers: Object.fromEntries(basicResponse.headers.entries())
      };

      if (basicResponse.ok) {
        const data = await basicResponse.json();
        results.basicConnectivity.dataReceived = !!data;
      }
    } catch (error: any) {
      results.basicConnectivity = {
        error: error.message,
        name: error.name,
        type: 'FETCH_ERROR'
      };
    }

    // Test 4: Authenticated request
    if (token) {
      try {
        const authResponse = await fetch(`${getApiUrl()}/api/xero/settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          credentials: 'include',
          mode: 'cors'
        });

        results.authenticatedRequest = {
          status: authResponse.status,
          statusText: authResponse.statusText,
          ok: authResponse.ok,
          headers: Object.fromEntries(authResponse.headers.entries())
        };

        if (authResponse.ok) {
          const data = await authResponse.json();
          results.authenticatedRequest.dataReceived = !!data;
          results.authenticatedRequest.responseData = data;
        } else {
          const errorData = await authResponse.text();
          results.authenticatedRequest.errorResponse = errorData;
        }
      } catch (error: any) {
        results.authenticatedRequest = {
          error: error.message,
          name: error.name,
          type: 'FETCH_ERROR'
        };
      }
    }

    setTestResults(results);
    setTesting(false);
    
    // Show summary toast
    if (results.basicConnectivity.ok) {
      toast.success('✅ Basic connectivity working!');
    } else {
      toast.error('❌ Connectivity issues detected');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Production API Diagnostic Tool
        </h2>
        <p className="text-gray-600">
          This tool helps diagnose API connectivity issues in production environments.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {testing ? '🔄 Running Diagnostics...' : '🚀 Run Full Diagnostic'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-6">
          {/* Environment Check */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🌍 Environment Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Production Mode:</strong> {testResults.environment?.isProd ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Build Mode:</strong> {testResults.environment?.mode}</div>
              <div><strong>Current Domain:</strong> {testResults.environment?.currentDomain}</div>
              <div><strong>VITE_API_URL:</strong> {testResults.environment?.viteApiUrl || '❌ Not set'}</div>
              <div className="col-span-2"><strong>Calculated API URL:</strong> {testResults.environment?.calculatedApiUrl}</div>
            </div>
          </div>

          {/* Authentication Check */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🔐 Authentication Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Has Token:</strong> {testResults.auth?.hasToken ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Token Length:</strong> {testResults.auth?.tokenLength || 0} characters</div>
              <div className="col-span-2"><strong>Token Preview:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{testResults.auth?.tokenPreview}</code></div>
            </div>
          </div>

          {/* Basic Connectivity */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🌐 Basic Connectivity (No Auth)</h3>
            {testResults.basicConnectivity?.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-red-800 font-medium">❌ Connection Failed</div>
                <div className="text-red-600 text-sm mt-1">
                  <strong>Error:</strong> {testResults.basicConnectivity.error}<br/>
                  <strong>Type:</strong> {testResults.basicConnectivity.name}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-green-800 font-medium">✅ Connection Successful</div>
                <div className="text-green-600 text-sm mt-1">
                  <strong>Status:</strong> {testResults.basicConnectivity?.status} {testResults.basicConnectivity?.statusText}<br/>
                  <strong>Data Received:</strong> {testResults.basicConnectivity?.dataReceived ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Request */}
          {testResults.auth?.hasToken && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">🔑 Authenticated Request</h3>
              {testResults.authenticatedRequest?.error ? (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-red-800 font-medium">❌ Authenticated Request Failed</div>
                  <div className="text-red-600 text-sm mt-1">
                    <strong>Error:</strong> {testResults.authenticatedRequest.error}<br/>
                    <strong>Type:</strong> {testResults.authenticatedRequest.name}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="text-green-800 font-medium">✅ Authenticated Request Successful</div>
                  <div className="text-green-600 text-sm mt-1">
                    <strong>Status:</strong> {testResults.authenticatedRequest?.status} {testResults.authenticatedRequest?.statusText}<br/>
                    <strong>Data Received:</strong> {testResults.authenticatedRequest?.dataReceived ? 'Yes' : 'No'}
                  </div>
                  {testResults.authenticatedRequest?.responseData && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-green-700 hover:text-green-900">View Response Data</summary>
                      <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                        {JSON.stringify(testResults.authenticatedRequest.responseData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Raw Results */}
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="font-semibold text-gray-800 cursor-pointer hover:text-gray-900">
              🔍 View Raw Diagnostic Results
            </summary>
            <pre className="bg-gray-100 p-4 rounded text-xs mt-3 overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ProductionDiagnostic;
