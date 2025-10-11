import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl, getRenderRedirectUri } from '../utils/envChecker';
import toast from 'react-hot-toast';

const XeroRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      const urlParams = new URLSearchParams(location.search);
      const success = urlParams.get('success');
      const error = urlParams.get('error');

      // Check if this is a success or error redirect from the backend
      if (success === 'true') {
        toast.success('Xero connection successful!');
      } else if (error) {
        toast.error(`Xero authorization failed: ${decodeURIComponent(error)}`);
      } else {
        // Default case - just redirect to Xero page
        toast.info('Redirecting to Xero integration...');
      }

      // Always redirect to the Xero page
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/xero`;
      console.log('🔧 Redirecting to:', redirectUrl);
      
      // Small delay to show the toast
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1500);
    };

    handleRedirect();
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