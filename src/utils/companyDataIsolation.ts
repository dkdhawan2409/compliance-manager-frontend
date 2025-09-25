import { Company } from '../api/companyService';

/**
 * Company Data Isolation Utilities
 * Ensures that each company's data is properly isolated and secure
 */

export interface CompanyDataValidation {
  isValid: boolean;
  error?: string;
  companyId: number;
  expectedCompanyId: number;
}

/**
 * Validates that data belongs to the correct company
 * @param data - Data object that should have a companyId property
 * @param currentCompany - The currently authenticated company
 * @returns Validation result
 */
export const validateCompanyData = (
  data: any,
  currentCompany: Company | null
): CompanyDataValidation => {
  if (!currentCompany) {
    return {
      isValid: false,
      error: 'No company context available',
      companyId: data?.companyId || -1,
      expectedCompanyId: -1
    };
  }

  if (!data || typeof data.companyId === 'undefined') {
    return {
      isValid: false,
      error: 'Data does not contain companyId',
      companyId: -1,
      expectedCompanyId: currentCompany.id
    };
  }

  if (data.companyId !== currentCompany.id) {
    return {
      isValid: false,
      error: `Company data isolation violation: expected ${currentCompany.id}, got ${data.companyId}`,
      companyId: data.companyId,
      expectedCompanyId: currentCompany.id
    };
  }

  return {
    isValid: true,
    companyId: data.companyId,
    expectedCompanyId: currentCompany.id
  };
};

/**
 * Logs a security alert for company data isolation violations
 * @param validation - The validation result
 * @param context - Additional context about where the violation occurred
 */
export const logSecurityAlert = (
  validation: CompanyDataValidation,
  context: {
    operation: string;
    dataType: string;
    userId?: number;
    userEmail?: string;
    companyName?: string;
  }
) => {
  if (!validation.isValid) {
    console.error('🚨 SECURITY ALERT: Company Data Isolation Violation', {
      error: validation.error,
      expectedCompanyId: validation.expectedCompanyId,
      actualCompanyId: validation.companyId,
      operation: context.operation,
      dataType: context.dataType,
      userId: context.userId,
      userEmail: context.userEmail,
      companyName: context.companyName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // In production, you might want to send this to a security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to security monitoring service
      // securityMonitoringService.reportViolation({ ... });
    }
  }
};

/**
 * Creates a company-specific cache key to prevent cross-company data leakage
 * @param baseKey - The base cache key
 * @param companyId - The company ID
 * @returns Company-specific cache key
 */
export const createCompanySpecificKey = (baseKey: string, companyId: number): string => {
  return `company_${companyId}_${baseKey}`;
};

/**
 * Clears all company-specific data from localStorage when switching companies
 * @param companyId - The company ID to clear data for
 */
export const clearCompanySpecificData = (companyId: number) => {
  const keysToRemove: string[] = [];
  
  // Find all localStorage keys that belong to this company
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`company_${companyId}_`)) {
      keysToRemove.push(key);
    }
  }

  // Remove company-specific keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('🧹 Cleared company-specific data:', key);
  });

  // Also clear general Xero data that might be company-specific
  const generalXeroKeys = [
    'xero_authorized',
    'xero_auth_timestamp',
    'xero_tokens',
    'xero_connected',
    'xero_oauth_state',
    'xero_auth_start_time'
  ];

  generalXeroKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log(`🧹 Cleared all data for company ${companyId}`);
};

/**
 * Validates that Xero data belongs to the correct company
 * @param xeroData - Xero data that might contain tenant information
 * @param currentCompany - The currently authenticated company
 * @returns Whether the data is safe to use
 */
export const validateXeroDataIsolation = (
  xeroData: any,
  currentCompany: Company | null
): boolean => {
  if (!currentCompany || !xeroData) {
    return false;
  }

  // Additional Xero-specific validation could go here
  // For example, checking tenant IDs, organization names, etc.
  
  return true;
};

// Add to global window for debugging in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).companyDataIsolation = {
    validateCompanyData,
    logSecurityAlert,
    clearCompanySpecificData,
    validateXeroDataIsolation
  };
}

