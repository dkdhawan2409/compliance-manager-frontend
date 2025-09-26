// Xero Status Badge Component
// Visual indicator of Xero connection status

import React from 'react';
import { Chip, Tooltip, IconButton } from '@mui/material';
import { 
  CloudSync, 
  CloudDone, 
  CloudOff, 
  Error as ErrorIcon, 
  Warning,
  Info,
  Refresh,
} from '@mui/icons-material';
import { useXero } from '../context/XeroProvider';
import { XeroStatusBadgeProps } from '../types';
import { XERO_CONNECTION_STATUS } from '../constants';

export const XeroStatusBadge: React.FC<XeroStatusBadgeProps> = ({
  status,
  showMessage = false,
  className = '',
  onClick,
}) => {
  const { state, refreshConnection } = useXero();
  const { connectionStatus, isLoading } = state;
  
  const currentStatus = status || connectionStatus?.connectionStatus || 'disconnected';

  const getStatusConfig = () => {
    switch (currentStatus) {
      case XERO_CONNECTION_STATUS.CONNECTED:
        return {
          label: 'Connected',
          color: 'success' as const,
          icon: <CloudDone />,
          message: 'Xero is connected and ready',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
        };
      
      case XERO_CONNECTION_STATUS.DISCONNECTED:
        return {
          label: 'Disconnected',
          color: 'default' as const,
          icon: <CloudOff />,
          message: 'Not connected to Xero',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
        };
      
      case XERO_CONNECTION_STATUS.EXPIRED:
        return {
          label: 'Expired',
          color: 'warning' as const,
          icon: <Warning />,
          message: 'Xero connection has expired',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
        };
      
      case XERO_CONNECTION_STATUS.ERROR:
        return {
          label: 'Error',
          color: 'error' as const,
          icon: <ErrorIcon />,
          message: 'Connection error occurred',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
        };
      
      case XERO_CONNECTION_STATUS.PENDING:
        return {
          label: 'Connecting',
          color: 'info' as const,
          icon: <CloudSync className="animate-spin" />,
          message: 'Connecting to Xero...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
        };
      
      case XERO_CONNECTION_STATUS.NOT_CONFIGURED:
        return {
          label: 'Not Configured',
          color: 'default' as const,
          icon: <Info />,
          message: 'Xero integration not configured',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
        };
      
      default:
        return {
          label: 'Unknown',
          color: 'default' as const,
          icon: <Info />,
          message: 'Unknown connection status',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (currentStatus !== XERO_CONNECTION_STATUS.CONNECTED) {
      refreshConnection();
    }
  };

  const badgeContent = (
    <div className={`xero-status-badge ${className}`}>
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        color={statusConfig.color}
        onClick={onClick || handleClick}
        className="cursor-pointer"
        disabled={isLoading}
      />
      
      {showMessage && (
        <div className={`mt-2 p-2 rounded border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
          <p className={`text-sm ${statusConfig.textColor}`}>
            {statusConfig.message}
          </p>
          
          {currentStatus === XERO_CONNECTION_STATUS.ERROR && state.error && (
            <p className={`text-xs mt-1 ${statusConfig.textColor}`}>
              Error: {state.error}
            </p>
          )}
          
          {currentStatus === XERO_CONNECTION_STATUS.EXPIRED && (
            <p className={`text-xs mt-1 ${statusConfig.textColor}`}>
              Please reconnect to continue using Xero features
            </p>
          )}
          
          {currentStatus === XERO_CONNECTION_STATUS.NOT_CONFIGURED && (
            <p className={`text-xs mt-1 ${statusConfig.textColor}`}>
              Configure Xero settings to get started
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (onClick || currentStatus !== XERO_CONNECTION_STATUS.CONNECTED) {
    return (
      <Tooltip title={`Click to ${currentStatus === XERO_CONNECTION_STATUS.CONNECTED ? 'view details' : 'refresh connection'}`}>
        {badgeContent}
      </Tooltip>
    );
  }

  return badgeContent;
};

// Compact version for headers/navbars
export const XeroStatusBadgeCompact: React.FC<XeroStatusBadgeProps> = (props) => {
  const { state } = useXero();
  const { connectionStatus } = state;
  
  const currentStatus = props.status || connectionStatus?.connectionStatus || 'disconnected';
  
  const getStatusIcon = () => {
    switch (currentStatus) {
      case XERO_CONNECTION_STATUS.CONNECTED:
        return <CloudDone className="text-green-600" />;
      case XERO_CONNECTION_STATUS.DISCONNECTED:
        return <CloudOff className="text-gray-400" />;
      case XERO_CONNECTION_STATUS.EXPIRED:
        return <Warning className="text-yellow-600" />;
      case XERO_CONNECTION_STATUS.ERROR:
        return <ErrorIcon className="text-red-600" />;
      case XERO_CONNECTION_STATUS.PENDING:
        return <CloudSync className="animate-spin text-blue-600" />;
      default:
        return <Info className="text-gray-400" />;
    }
  };

  return (
    <Tooltip title={`Xero: ${currentStatus}`}>
      <IconButton 
        size="small" 
        onClick={props.onClick}
        className={props.className}
      >
        {getStatusIcon()}
      </IconButton>
    </Tooltip>
  );
};
