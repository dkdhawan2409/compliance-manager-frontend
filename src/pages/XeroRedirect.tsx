import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const XeroRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast.error(`Xero authorization failed: ${error}`);
      setLoading(false);
      return;
    }

    if (code && state) {
      // Redirect directly to backend callback URL instead of making AJAX request
      const backendCallbackUrl = `${import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api'}/xero/callback?code=${code}&state=${state}`;
      
      console.log('Redirecting to backend callback:', backendCallbackUrl);
      window.location.href = backendCallbackUrl;
    } else {
      toast.error('Invalid OAuth callback - missing code or state');
      setLoading(false);
    }
  }, [location]);

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