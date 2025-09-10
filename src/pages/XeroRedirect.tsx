import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl, getRenderRedirectUri } from '../utils/envChecker';
import toast from 'react-hot-toast';

const XeroRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        toast.error(`Xero authorization failed: ${error}`);
        setLoading(false);
        navigate('/integrations/xero');
        return;
      }

      if (!code || !state) {
        toast.error('Invalid OAuth callback - missing code or state');
        setLoading(false);
        navigate('/integrations/xero');
        return;
      }

      try {
        // Make API call to backend to handle the OAuth callback
        const apiUrl = getApiUrl();
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication token not found. Please log in again.');
          setLoading(false);
          navigate('/login');
          return;
        }

        // Use Render redirect URI (no localhost)
        const redirectUri = getRenderRedirectUri();

        console.log('🔧 Making OAuth callback with RENDER redirect URI:', redirectUri);
        console.log('🔧 NO LOCALHOST - Using Render domain only');

        const response = await fetch(`${apiUrl}/xero/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code,
            state,
            redirect_uri: redirectUri
          })
        });

        if (response.ok) {
          const result = await response.json();
          toast.success('Xero connection successful!');
          console.log('Xero OAuth successful:', result);
          navigate('/integrations/xero');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Xero OAuth failed:', errorData);
          toast.error(`Xero authorization failed: ${errorData.message || 'Unknown error'}`);
          navigate('/integrations/xero');
        }
      } catch (error) {
        console.error('Xero OAuth error:', error);
        toast.error('Failed to complete Xero authorization. Please try again.');
        navigate('/integrations/xero');
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connecting to Xero...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your Xero authorization.
          </p>
        </div>
      </div>
    </div>
  );
};

export default XeroRedirect; 