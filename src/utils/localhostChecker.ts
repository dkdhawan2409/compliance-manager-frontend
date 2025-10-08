/**
 * Localhost Configuration Checker
 * Ensures all API calls are going to localhost in development
 */

export const checkLocalhostConfiguration = () => {
  const config = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001',
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    currentHostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
  };

  const isUsingLocalhost = config.apiUrl.includes('localhost') || config.apiUrl.includes('127.0.0.1');
  const isOnLocalhost = config.currentHostname.includes('localhost') || config.currentHostname.includes('127.0.0.1');

  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if we're in development but not using localhost
  if (config.isDevelopment && !isUsingLocalhost) {
    errors.push('Development mode but API URL is not localhost');
  }

  // Check if we're on localhost but using production API
  if (isOnLocalhost && !isUsingLocalhost) {
    errors.push('Running on localhost but API URL points to production');
  }

  // Check if we're in production but using localhost (should not happen)
  if (config.isProduction && isUsingLocalhost) {
    errors.push('Production mode but API URL is localhost (this should not happen)');
  }

  // Warnings for potential issues
  if (!config.isDevelopment && !config.isProduction) {
    warnings.push('Unknown environment mode');
  }

  if (!isOnLocalhost && config.isDevelopment) {
    warnings.push('Development mode but not running on localhost');
  }

  return {
    config,
    isUsingLocalhost,
    isOnLocalhost,
    warnings,
    errors,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    isValid: errors.length === 0
  };
};

export const logLocalhostConfiguration = () => {
  const check = checkLocalhostConfiguration();
  
  console.group('🔧 Localhost Configuration Check');
  
  console.log('📋 Configuration:', check.config);
  console.log('🌐 Using localhost API:', check.isUsingLocalhost);
  console.log('🏠 Running on localhost:', check.isOnLocalhost);
  
  if (check.hasErrors) {
    console.error('❌ Errors:', check.errors);
  }
  
  if (check.hasWarnings) {
    console.warn('⚠️ Warnings:', check.warnings);
  }
  
  if (check.isValid) {
    console.log('✅ Configuration is valid for localhost development');
  } else {
    console.error('❌ Configuration has errors');
  }
  
  console.groupEnd();
  
  return check;
};

export const getApiUrlForDisplay = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
  
  // Highlight if it's not localhost in development
  if (import.meta.env.DEV && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
    console.warn('⚠️ Development mode but API URL is not localhost:', apiUrl);
  }
  
  return apiUrl;
};

export const getEnvironmentInfo = () => {
  return {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    apiUrl: getApiUrlForDisplay(),
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001',
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown'
  };
};
