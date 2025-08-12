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

// Utility functions for domain and API URL management
export const getCurrentDomain = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For production, use environment variable or a default production domain
  return import.meta.env.VITE_FRONTEND_URL || 'https://yourdomain.com';
};

export const getApiUrl = (): string => {
  // In production, always use the environment variable or production URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';
  }
  // In development, allow localhost fallback
  return import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
};

export const getRedirectUrl = (): string => {
  return `${getCurrentDomain()}/redirecturl`;
}; 

// Production-safe environment checker
export const checkProductionEnvironment = () => {
  const issues: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // Check if we're in production
  if (import.meta.env.PROD) {
    info.push('Running in production mode');
    
    // Ensure API URL is set for production
    if (!import.meta.env.VITE_API_URL) {
      warnings.push('VITE_API_URL not set - using default production backend URL');
    }
    
    // Check for any localhost references
    const currentDomain = getCurrentDomain();
    if (currentDomain.includes('localhost')) {
      issues.push('Current domain contains localhost - this should not happen in production');
    }
    
    const apiUrl = getApiUrl();
    if (apiUrl.includes('localhost')) {
      issues.push('API URL contains localhost - this should not happen in production');
    }
  } else {
    info.push('Running in development mode');
    if (!import.meta.env.VITE_API_URL) {
      info.push('VITE_API_URL is not set - using default development backend URL: http://localhost:3333/api');
    }
  }

  return { issues, warnings, info };
}; 