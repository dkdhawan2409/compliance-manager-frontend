import React, { useState } from 'react';
import { logEnvironmentInfo } from '../utils/envChecker';
import toast from 'react-hot-toast';

interface XeroDebugPanelProps {
  onTestOAuth?: () => Promise<void>;
}

const XeroDebugPanel: React.FC<XeroDebugPanelProps> = ({ onTestOAuth }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runComprehensiveTest = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      console.log('🔍 Starting comprehensive Xero OAuth debug test...');

      // Test 1: Environment Check
      console.log('📋 Test 1: Environment Check');
      const envInfo = logEnvironmentInfo();
      results.tests.environment = {
        success: !envInfo.hasIssues,
        issues: envInfo.issues,
        warnings: envInfo.warnings,
        info: envInfo.info
      };

      // Test 2: Backend Health
      console.log('🏥 Test 2: Backend Health Check');
      try {
        const healthResponse = await fetch('http://localhost:3333/api/health');
        const healthData = await healthResponse.json();
        results.tests.backendHealth = {
          success: healthResponse.ok,
          status: healthResponse.status,
          data: healthData
        };
      } catch (error) {
        results.tests.backendHealth = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Authentication Token
      console.log('🔐 Test 3: Authentication Token Check');
      const token = localStorage.getItem('token');
      results.tests.authentication = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
      };

      // Test 4: Xero Settings Endpoint
      console.log('⚙️ Test 4: Xero Settings Endpoint');
      if (token) {
        try {
          const settingsResponse = await fetch('http://localhost:3333/api/xero/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          results.tests.xeroSettings = {
            success: settingsResponse.ok,
            status: settingsResponse.status,
            hasData: settingsResponse.ok
          };
          
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            results.tests.xeroSettings.data = settingsData;
          }
        } catch (error) {
          results.tests.xeroSettings = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else {
        results.tests.xeroSettings = {
          success: false,
          error: 'No authentication token available'
        };
      }

      // Test 5: OAuth Login Endpoint
      console.log('🔗 Test 5: OAuth Login Endpoint');
      if (token) {
        try {
          const oauthResponse = await fetch('http://localhost:3333/api/xero/login', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          results.tests.oauthLogin = {
            success: oauthResponse.ok,
            status: oauthResponse.status,
            hasData: oauthResponse.ok
          };
          
          if (oauthResponse.ok) {
            const oauthData = await oauthResponse.json();
            results.tests.oauthLogin.data = oauthData;
            
            // Validate OAuth URL
            if (oauthData.data?.authUrl) {
              const authUrl = oauthData.data.authUrl;
              results.tests.oauthLogin.urlValidation = {
                isValid: authUrl.startsWith('https://login.xero.com/'),
                hasClientId: authUrl.includes('client_id='),
                hasRedirectUri: authUrl.includes('redirect_uri='),
                hasScope: authUrl.includes('scope='),
                hasState: authUrl.includes('state=')
              };
            }
          }
        } catch (error) {
          results.tests.oauthLogin = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else {
        results.tests.oauthLogin = {
          success: false,
          error: 'No authentication token available'
        };
      }

      // Test 6: OAuth Callback Endpoint (simulation)
      console.log('🔄 Test 6: OAuth Callback Endpoint Simulation');
      if (token) {
        try {
          const callbackResponse = await fetch('http://localhost:3333/api/xero/callback', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code: 'test_code',
              state: 'test_state'
            })
          });
          
          results.tests.oauthCallback = {
            success: callbackResponse.ok,
            status: callbackResponse.status,
            expectedError: !callbackResponse.ok // Should fail with test data
          };
          
          if (!callbackResponse.ok) {
            const errorData = await callbackResponse.json();
            results.tests.oauthCallback.errorData = errorData;
            
            // Check if this is the "Invalid authorization code" error
            if (errorData.message?.includes('Invalid authorization code')) {
              results.tests.oauthCallback.isExpectedError = true;
              results.tests.oauthCallback.errorType = 'Invalid authorization code (expected with test data)';
            }
          }
        } catch (error) {
          results.tests.oauthCallback = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else {
        results.tests.oauthCallback = {
          success: false,
          error: 'No authentication token available'
        };
      }

      // Test 7: Browser Environment
      console.log('🌐 Test 7: Browser Environment');
      results.tests.browserEnvironment = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port,
        pathname: window.location.pathname,
        search: window.location.search
      };

      setTestResults(results);
      console.log('✅ Comprehensive test completed:', results);
      toast.success('Debug test completed! Check results below.');

    } catch (error) {
      console.error('❌ Debug test failed:', error);
      results.error = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(results);
      toast.error('Debug test failed. Check console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  const exportResults = () => {
    if (!testResults) return;
    
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xero-oauth-debug-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🔧 Xero OAuth Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={runComprehensiveTest}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isTesting ? 'Running Tests...' : 'Run Debug Test'}
          </button>
          {testResults && (
            <button
              onClick={exportResults}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Export Results
            </button>
          )}
        </div>
      </div>

      {isTesting && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">Running comprehensive OAuth debug tests...</span>
          </div>
        </div>
      )}

      {testResults && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📊 Test Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(testResults.tests).map(([testName, testResult]: [string, any]) => (
                <div key={testName} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="font-medium">{testName}</div>
                  <div className="text-xs text-gray-600">
                    {testResult.success ? 'PASS' : 'FAIL'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(testResults.tests).map(([testName, testResult]: [string, any]) => (
              <div key={testName} className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2 capitalize">{testName}</h5>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {testResult.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {testResult.error && (
                    <div className="mb-2">
                      <span className="font-medium">Error:</span>
                      <span className="ml-2 text-red-600">{testResult.error}</span>
                    </div>
                  )}
                  
                  {testResult.status && (
                    <div className="mb-2">
                      <span className="font-medium">HTTP Status:</span>
                      <span className="ml-2">{testResult.status}</span>
                    </div>
                  )}
                  
                  {testResult.data && (
                    <div className="mb-2">
                      <span className="font-medium">Response Data:</span>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {testResult.urlValidation && (
                    <div className="mb-2">
                      <span className="font-medium">OAuth URL Validation:</span>
                      <div className="mt-1 space-y-1">
                        {Object.entries(testResult.urlValidation).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center text-xs">
                            <span className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="font-medium">{key}:</span>
                            <span className="ml-1">{value ? '✓' : '✗'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Analysis */}
          {testResults.tests.oauthCallback?.errorData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">🚨 OAuth Error Analysis</h4>
              <div className="text-sm text-yellow-800">
                <p><strong>Error Type:</strong> {testResults.tests.oauthCallback.errorType || 'Unknown'}</p>
                <p><strong>Message:</strong> {testResults.tests.oauthCallback.errorData.message}</p>
                <p><strong>Expected:</strong> {testResults.tests.oauthCallback.isExpectedError ? 'Yes (using test data)' : 'No'}</p>
                <p className="mt-2">
                  <strong>Likely Causes:</strong>
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Backend OAuth implementation missing or incorrect</li>
                  <li>Xero app configuration mismatch</li>
                  <li>Redirect URI mismatch between frontend and Xero app</li>
                  <li>Client ID/Secret configuration issues</li>
                  <li>OAuth state validation problems</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XeroDebugPanel; 