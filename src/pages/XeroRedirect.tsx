import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useXero } from '../hooks/useXero';

const XeroRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleCallback, isLoading, error } = useXero();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast.error(`Xero authorization failed: ${error}`);
      navigate('/integrations/xero');
      return;
    }

    if (code && state) {
      // Handle the OAuth callback
      handleCallback(code, state)
        .then(() => {
          toast.success('Successfully connected to Xero!');
          navigate('/integrations/xero');
        })
        .catch((err: any) => {
          toast.error(err.response?.data?.message || 'Failed to connect to Xero');
          navigate('/integrations/xero');
        });
    } else {
      // No authorization code, redirect back to Xero integration page
      toast.error('Invalid OAuth callback - missing authorization code');
      navigate('/integrations/xero');
    }
  }, [location, handleCallback, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connecting to Xero...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your Xero authorization.
          </p>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XeroRedirect; 