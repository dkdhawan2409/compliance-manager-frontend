import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useXero } from '../contexts/XeroContext';

const XeroRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Please wait while we complete your Xero authorization.');
  const { handleCallback } = useXero();

  useEffect(() => {
    const handleRedirect = async () => {
      const urlParams = new URLSearchParams(location.search);
      const success = urlParams.get('success');
      const error = urlParams.get('error');
      const code = urlParams.get('code');
      const stateFromQuery = urlParams.get('state');

      // If we have a code, complete the OAuth flow before redirecting
      if (code) {
        setStatusMessage('Completing Xero authorization...');
        setLoading(true);
        try {
          let oauthState = stateFromQuery;
          if (!oauthState) {
            oauthState = sessionStorage.getItem('xero_oauth_state') || undefined;
          }

          if (!oauthState) {
            throw new Error('Missing OAuth state. Please restart the Xero connection.');
          }

          await handleCallback(code, oauthState);

          // Clear stored state to avoid reuse
          try {
            sessionStorage.removeItem('xero_oauth_state');
          } catch (storageError) {
            console.warn('⚠️ Unable to clear stored Xero OAuth state:', storageError);
          }

          toast.success('Xero connection successful!');
          navigate('/xero', { replace: true });
          return;
        } catch (callbackError: any) {
          console.error('❌ Failed to process Xero callback:', callbackError);
          const message =
            callbackError?.message || 'Failed to complete Xero authorization. Please try again.';
          toast.error(message);
          navigate('/xero', { replace: true });
          return;
        } finally {
          setLoading(false);
        }
      }

      // Check if this is a success or error redirect from the backend
      if (success === 'true') {
        toast.success('Xero connection successful!');
        setStatusMessage('Redirecting to your Xero integration...');
      } else if (error) {
        toast.error(`Xero authorization failed: ${decodeURIComponent(error)}`);
        setStatusMessage('Returning to Xero integration...');
      } else {
        toast.info('Redirecting to Xero integration...');
        setStatusMessage('Redirecting to your Xero integration...');
      }

      setLoading(false);

      // Always redirect to the Xero page
      navigate('/xero', { replace: true });
    };

    handleRedirect();
  }, [location, navigate, handleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {loading ? 'Connecting to Xero...' : 'Redirecting...'}
          </h2>
          <p className="text-gray-600">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default XeroRedirect; 
