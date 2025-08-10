/// <reference types="vite/client" />

export const checkEnvironment = () => {
  const issues: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // Check API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    issues.push('VITE_API_URL is not set - using default backend URL: http://localhost:3333/api');
  } else {
    info.push(`API URL: ${apiUrl}`);
  }

  // Check if we're in development mode
  if (import.meta.env.DEV) {
    info.push('Running in development mode');
  }

  // Check for token
  const token = localStorage.getItem('token');
  if (!token) {
    warnings.push('No authentication token found - user may not be logged in');
  } else {
    info.push('Authentication token found');
  }

  // Check for company ID
  const companyId = localStorage.getItem('companyId');
  if (!companyId) {
    warnings.push('No company ID found - this may be normal for new users');
  } else {
    info.push(`Company ID: ${companyId}`);
  }

  return {
    issues,
    warnings,
    info,
    hasIssues: issues.length > 0,
    hasWarnings: warnings.length > 0
  };
};

export const logEnvironmentInfo = () => {
  const env = checkEnvironment();
  
  console.group('🔧 Environment Check');
  
  if (env.issues.length > 0) {
    console.error('❌ Issues:', env.issues);
  }
  
  if (env.warnings.length > 0) {
    console.warn('⚠️ Warnings:', env.warnings);
  }
  
  if (env.info.length > 0) {
    console.info('ℹ️ Info:', env.info);
  }
  
  console.groupEnd();
  
  return env;
}; 