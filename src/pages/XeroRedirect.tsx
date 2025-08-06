import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useXero } from '../hooks/useXero';

const XeroRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleCallback } = useXero();
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
      // POST code and state to backend
      axios.post('/api/xero/callback', { code, state })
        .then(() => {
          // Now update frontend state/context
          return handleCallback(code, state);
        })
        .then(() => {
          toast.success('Xero connected successfully!');
          navigate('/integrations/xero');
        })
        .catch(err => {
          toast.error(err.response?.data?.message || 'Failed to complete Xero OAuth');
          setLoading(false);
        });
    } else {
      toast.error('Invalid OAuth callback - missing code or state');
      setLoading(false);
    }
  }, [location, navigate, handleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? (
        <div>Connecting to Xero...</div>
      ) : (
        <div>There was a problem connecting to Xero.</div>
      )}
    </div>
  );
};

export default XeroRedirect; 