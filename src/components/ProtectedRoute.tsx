import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, company } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If superadmin is trying to access a non-admin route, redirect to /admin/companies
  if (company?.role === 'superadmin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/companies" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
