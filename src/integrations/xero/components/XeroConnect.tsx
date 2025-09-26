// Xero Connect Component
// Simple, reusable component for initiating Xero OAuth connection

import React from 'react';
import { Button } from '@mui/material';
import { ConnectWithoutContact, CloudSync, Error as ErrorIcon } from '@mui/icons-material';
import { useXero } from '../context/XeroProvider';
import { XeroConnectProps } from '../types';

export const XeroConnect: React.FC<XeroConnectProps> = ({
  onSuccess,
  onError,
  className = '',
  disabled = false,
  children,
}) => {
  const { state, startAuth, clearError } = useXero();
  const { isLoading, error, isConnected, hasSettings } = state;

  const handleConnect = async () => {
    try {
      clearError();
      await startAuth();
      
      // Note: onSuccess will be called from the callback handler
      // since the OAuth flow redirects to Xero and back
    } catch (error: any) {
      console.error('❌ Connect error:', error);
      onError?.(error.message || 'Failed to connect to Xero');
    }
  };

  const getButtonContent = () => {
    if (children) return children;
    
    if (isLoading) {
      return (
        <>
          <CloudSync className="animate-spin mr-2" />
          Connecting...
        </>
      );
    }
    
    if (isConnected) {
      return (
        <>
          <ConnectWithoutContact className="mr-2" />
          Connected to Xero
        </>
      );
    }
    
    return (
      <>
        <ConnectWithoutContact className="mr-2" />
        Connect to Xero
      </>
    );
  };

  const getButtonVariant = () => {
    if (isConnected) return 'contained';
    return 'outlined';
  };

  const getButtonColor = () => {
    if (isConnected) return 'success';
    if (error) return 'error';
    return 'primary';
  };

  return (
    <div className={`xero-connect ${className}`}>
      <Button
        variant={getButtonVariant()}
        color={getButtonColor()}
        onClick={handleConnect}
        disabled={disabled || isLoading || isConnected}
        size="large"
        className="w-full"
        startIcon={
          error ? <ErrorIcon /> : 
          isLoading ? <CloudSync className="animate-spin" /> : 
          <ConnectWithoutContact />
        }
      >
        {getButtonContent()}
      </Button>
      
      {!hasSettings && !isConnected && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            ⚠️ Xero Client ID is not configured. Please ask your administrator to configure Xero client credentials.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {isConnected && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            ✓ Successfully connected to Xero
          </p>
        </div>
      )}
    </div>
  );
};
