import { Company } from '../api/companyService';

export interface UserRole {
  isCompany: boolean;
  isSuperAdmin: boolean;
  canAccessXero: boolean;
  canManageIntegrations: boolean;
  canAccessAITools: boolean;
}

export const getUserRole = (company: Company | null): UserRole => {
  if (!company) {
    return {
      isCompany: false,
      isSuperAdmin: false,
      canAccessXero: false,
      canManageIntegrations: false,
      canAccessAITools: false,
    };
  }

  // More robust super admin detection
  const isSuperAdmin = company.superadmin === true || company.role === 'superadmin' || company.role === 'admin';
  const isCompany = !isSuperAdmin;

  return {
    isCompany,
    isSuperAdmin,
    canAccessXero: isCompany, // Only companies can access Xero
    canManageIntegrations: isCompany, // Only companies can manage integrations
    canAccessAITools: isSuperAdmin, // Only super admins can access AI Tools
  };
};

export const requireCompanyAccess = (company: Company | null): boolean => {
  const role = getUserRole(company);
  return role.canAccessXero;
};

export const requireSuperAdminAccess = (company: Company | null): boolean => {
  const role = getUserRole(company);
  return role.isSuperAdmin;
};

export const requireAIToolsAccess = (company: Company | null): boolean => {
  const role = getUserRole(company);
  return role.canAccessAITools;
};

// Hook for easy access to role information
export const useUserRole = (company: Company | null): UserRole => {
  return getUserRole(company);
}; 