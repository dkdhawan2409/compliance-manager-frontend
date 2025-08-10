import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useXero } from '../contexts/XeroContext';

interface XeroTenant {
  id: string;
  name: string;
}

const XeroCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<XeroTenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { handleCallback } = useXero();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDetailsParam = searchParams.get('errorDetails');

        console.log('Processing callback with params:', {
          code: code ? 'present' : 'missing',
          state: state ? 'present' : 'missing',
          error: errorParam,
          errorDetails: errorDetailsParam
        });

        // Handle error case
        if (errorParam) {
          const errorMessage = errorDetailsParam 
            ? `${errorParam}: ${errorDetailsParam}` 
            : errorParam;
          setError(errorParam);
          setErrorDetails(errorDetailsParam);
          setSuccess(false);
          toast.error(`Xero connection failed: ${decodeURIComponent(errorMessage)}`);
          setIsProcessing(false);
          return;
        }

        // Handle success case with code and state
        if (code && state) {
          console.log('🔄 Processing successful callback with code and state');
          await handleCallback(code, state);
          setSuccess(true);
          // The handleCallback function will handle the redirect
        } else {
          console.error('❌ Missing code or state in callback');
          setError('Invalid callback parameters');
          setSuccess(false);
          toast.error('Invalid callback parameters. Please try again.');
        }

        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing callback:', err);
        setError('Failed to process callback');
        setSuccess(false);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, handleCallback]);

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleNavigateToSettings = () => {
    navigate('/integrations/xero');
  };

  const handleRetry = () => {
    navigate('/integrations/xero');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Xero Connection...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your Xero authorization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        {success ? (
          // Success State
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Xero Connected Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your Xero account has been successfully connected to the compliance management system.
            </p>
            
            {companyId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">
                  <strong>Company ID:</strong> {companyId}
                </p>
              </div>
            )}

            {tenants.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Connected Xero Organizations:
                </h3>
                <ul className="space-y-2">
                  {tenants.map((tenant) => (
                    <li key={tenant.id} className="text-blue-700">
                      • {tenant.name} (ID: {tenant.id})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleNavigateToDashboard}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleNavigateToSettings}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Xero Settings
              </button>
            </div>
          </div>
        ) : (
          // Error State
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Xero Connection Failed
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium mb-2">
                  Error: {decodeURIComponent(error)}
                </p>
                {errorDetails && (
                  <p className="text-red-700 text-sm">
                    Details: {decodeURIComponent(errorDetails)}
                  </p>
                )}
              </div>
            )}

            <p className="text-gray-600 mb-6">
              There was an issue connecting your Xero account. Please check your settings and try again.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleNavigateToDashboard}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroCallback; 