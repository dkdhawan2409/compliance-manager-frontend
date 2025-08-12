import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';

const DebugSuperAdmin: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-2">🔍 Super Admin Debug Info</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>Company ID:</strong> {company?.id}</p>
        <p><strong>Company Name:</strong> {company?.companyName}</p>
        <p><strong>Email:</strong> {company?.email}</p>
        <p><strong>Role:</strong> {company?.role}</p>
        <p><strong>Superadmin Flag:</strong> {String(company?.superadmin)}</p>
        <p><strong>Is Super Admin:</strong> {String(userRole.isSuperAdmin)}</p>
        <p><strong>Can Access AI Tools:</strong> {String(userRole.canAccessAITools)}</p>
        <hr className="my-2" />
        <p><strong>Raw Company Object:</strong></p>
        <pre className="text-xs bg-yellow-50 p-2 rounded overflow-auto">
          {JSON.stringify(company, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugSuperAdmin;

