import { Company } from '../api/companyService';

export interface UserRole {
  isCompany: boolean;
  isSuperAdmin: boolean;
  canAccessXero: boolean;
  canManageIntegrations: boolean;
}

export const getUserRole = (company: Company | null): UserRole => {
  if (!company) {
    return {
      isCompany: false,
      isSuperAdmin: false,
      canAccessXero: false,
      canManageIntegrations: false,
    };
  }

  const isSuperAdmin = company.superadmin === true;
  const isCompany = !isSuperAdmin;

  return {
    isCompany,
    isSuperAdmin,
    canAccessXero: isCompany, // Only companies can access Xero
    canManageIntegrations: isCompany, // Only companies can manage integrations
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

// Hook for easy access to role information
export const useUserRole = (company: Company | null): UserRole => {
  return getUserRole(company);
}; 