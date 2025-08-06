import React from 'react';
import { useConnectionStatus } from '../hooks/useXeroQueries';

interface ConnectionHealthBadgeProps {
  connectionId: string;
  className?: string;
}

const ConnectionHealthBadge: React.FC<ConnectionHealthBadgeProps> = ({ 
  connectionId, 
  className = '' 
}) => {
  const { isActive, isExpired, isDisconnected, status } = useConnectionStatus(Number(connectionId));

  const getBadgeConfig = () => {
    if (isActive) {
      return {
        text: 'Connected',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: '🟢',
      };
    } else if (isExpired) {
      return {
        text: 'Expired',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '🟡',
      };
    } else if (isDisconnected) {
      return {
        text: 'Disconnected',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: '🔴',
      };
    } else {
      return {
        text: 'Unknown',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: '⚪',
      };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

export default ConnectionHealthBadge; 