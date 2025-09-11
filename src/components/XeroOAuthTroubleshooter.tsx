import React, { useState, useEffect } from 'react';
import { xeroOAuthHelper } from '../utils/xeroOAuthHelper';
import { getCurrentDomain, getProductionSafeRedirectUri, getRenderRedirectUri } from '../utils/envChecker';
import toast from 'react-hot-toast';

const XeroOAuthTroubleshooter: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [oauthState, setOAuthState] = useState(xeroOAuthHelper.getOAuthState());
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    setRedirectUri(getRenderRedirectUri()); // Always use static Render redirect URI
  }, []);

  const handleTestRedirectUri = async () => {
    try {
      const testUri = getRenderRedirectUri(); // Always use static Render redirect URI
      setRedirectUri(testUri);
      toast.success('Redirect URI updated successfully');
    } catch (error) {
      toast.error('Failed to update redirect URI');
    }
  };

  const handleForceProductionUri = () => {
    try {
      const productionUri = getRenderRedirectUri(); // Always use static Render redirect URI
      setRedirectUri(productionUri);
      toast.success('Production-safe redirect URI applied');
    } catch (error) {
      toast.error('Failed to apply production URI');
    }
  };

  const handleForceRenderUri = () => {
    try {
      const renderUri = getRenderRedirectUri();
      setRedirectUri(renderUri);
      toast.success('Render redirect URI applied (NO LOCALHOST)');
    } catch (error) {
      toast.error('Failed to apply Render URI');
    }
  };

  const handleTestOAuthFlow = async () => {
    try {
      // Test the OAuth flow generation
      const { getXeroAuthUrl } = await import('../api/xeroService');
      const result = await getXeroAuthUrl();
      console.log('🔧 Test OAuth flow result:', result);
      toast.success('OAuth flow test completed - check console for details');
    } catch (error) {
      console.error('❌ OAuth flow test failed:', error);
      toast.error('OAuth flow test failed - check console for details');
    }
  };

  const handleResetOAuth = () => {
    xeroOAuthHelper.resetOAuth();
    setOAuthState(xeroOAuthHelper.getOAuthState());
    toast.success('OAuth flow reset successfully');
  };

  const handleCopyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    toast.success('Redirect URI copied to clipboard!');
  };

  const handleOpenXeroApp = () => {
    const xeroAppUrl = 'https://developer.xero.com/myapps';
    window.open(xeroAppUrl, '_blank');
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-800">🔧 OAuth Troubleshooter</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-white border border-gray-200 rounded p-3">
            <h5 className="font-medium text-gray-800 mb-2">Current Status</h5>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>OAuth in Progress:</strong> {oauthState.isInProgress ? 'Yes' : 'No'}</p>
              <p><strong>Environment:</strong> {import.meta.env.PROD ? 'Production' : 'Development'}</p>
              <p><strong>Current Domain:</strong> {getCurrentDomain()}</p>
              <p><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Not available'}</p>
              <p><strong>VITE_FRONTEND_URL:</strong> {import.meta.env.VITE_FRONTEND_URL || 'Not set'}</p>
              <p><strong>Is Production Domain:</strong> {typeof window !== 'undefined' && window.location.origin.includes('onrender.com') ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Redirect URI */}
          <div className="bg-white border border-gray-200 rounded p-3">
            <h5 className="font-medium text-gray-800 mb-2">Redirect URI</h5>
            <div className="space-y-2">
              <div className="p-2 bg-gray-100 rounded text-sm font-mono break-all">
                {redirectUri}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleCopyRedirectUri}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  📋 Copy URI
                </button>
                <button
                  onClick={handleTestRedirectUri}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  🔄 Refresh URI
                </button>
                <button
                  onClick={handleForceRenderUri}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  🚀 Force Render URI (NO LOCALHOST)
                </button>
                <button
                  onClick={handleForceProductionUri}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                >
                  🔧 Force Production URI
                </button>
              </div>
            </div>
          </div>

          {/* Xero App Configuration */}
          <div className="bg-white border border-gray-200 rounded p-3">
            <h5 className="font-medium text-gray-800 mb-2">Xero App Configuration</h5>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Make sure your Xero app has this redirect URI configured:</p>
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm font-mono break-all">
                {redirectUri}
              </div>
              <button
                onClick={handleOpenXeroApp}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
              >
                🔗 Open Xero App Settings
              </button>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-white border border-gray-200 rounded p-3">
            <h5 className="font-medium text-gray-800 mb-2">Common Issues & Solutions</h5>
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <p className="font-medium text-red-600">❌ Invalid redirect_uri</p>
                <p>• Copy the redirect URI above and add it to your Xero app</p>
                <p>• Make sure it matches exactly (including protocol and port)</p>
              </div>
              <div>
                <p className="font-medium text-red-600">❌ unauthorized_client</p>
                <p>• Check your Client ID and Client Secret</p>
                <p>• Verify the redirect URI is configured in Xero app</p>
              </div>
              <div>
                <p className="font-medium text-red-600">❌ OAuth flow expired</p>
                <p>• Click "Reset OAuth Flow" below and try again</p>
                <p>• Complete the OAuth flow within 5 minutes</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded p-3">
            <h5 className="font-medium text-gray-800 mb-2">Actions</h5>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleResetOAuth}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                🔄 Reset OAuth Flow
              </button>
              <button
                onClick={handleTestOAuthFlow}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                🧪 Test OAuth Flow
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XeroOAuthTroubleshooter;
