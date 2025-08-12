import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole, requireAIToolsAccess } from '../utils/roleUtils';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { isAuthenticated, company, loading } = useAuth();
  const userRole = useUserRole(company);

  console.log('SuperAdminRoute:', {
    isAuthenticated,
    companyRole: company?.role,
    isSuperAdmin: userRole.isSuperAdmin,
    loading
  });

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAIToolsAccess(company)) {
    console.log('Access denied: User does not have super admin access');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
