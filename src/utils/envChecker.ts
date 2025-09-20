/// <reference types="vite/client" />

import { DOMAIN_CONFIG } from '../config/domainConfig';

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
  // Always check window.location.origin first (most reliable)
  if (typeof window !== 'undefined') {
    const windowDomain = window.location.origin;
    console.log('🔧 Window domain detected:', windowDomain);
    
    // If we're on a production domain, use it
    if (windowDomain.includes('onrender.com') || windowDomain.includes('vercel.app') || windowDomain.includes('netlify.app')) {
      console.log('🔧 Using production window domain:', windowDomain);
      return windowDomain;
    }
    
    // If we're on localhost, use it for development
    if (windowDomain.includes('localhost')) {
      console.log('🔧 Using localhost domain for development:', windowDomain);
      return windowDomain;
    }
  }
  
  // In production, prioritize environment variable
  if (import.meta.env.PROD) {
    const envDomain = import.meta.env.VITE_FRONTEND_URL;
    if (envDomain) {
      console.log('🔧 Using environment domain for production:', envDomain);
      return envDomain;
    }
    
    // Final production fallback
    const fallbackDomain = 'https://compliance-manager-frontend.onrender.com';
    console.log('🔧 Using production fallback domain:', fallbackDomain);
    return fallbackDomain;
  }
  
  // Development fallback
  const fallbackDomain = 'http://localhost:3000';
  console.log('🔧 Using development fallback domain:', fallbackDomain);
  return fallbackDomain;
};

export const getApiUrl = (): string => {
  // Check if we're running on a production domain
  const isProductionDomain = typeof window !== 'undefined' && 
    (window.location.hostname.includes('onrender.com') || 
     window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('netlify.app'));

  // If on production domain, always use production API
  if (isProductionDomain) {
    const prodUrl = 'https://compliance-manager-backend.onrender.com/api';
    console.log('🔧 Production domain detected, using production API:', prodUrl);
    return prodUrl;
  }

  // If in production build but not on production domain (e.g., local production build)
  if (import.meta.env.PROD) {
    const envUrl = import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';
    console.log('🔧 Production build, using environment API URL:', envUrl);
    return envUrl;
  }
  
  // Development mode - use localhost
  const devUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
  console.log('🔧 Development mode, using localhost API:', devUrl);
  return devUrl;
};

export const getRedirectUrl = (): string => {
  return `${getCurrentDomain()}/redirecturl`;
}; 

// Force correct redirect URI for OAuth flow
export const getForcedRedirectUri = (): string => {
  // Always use the current domain to handle dynamic ports in development
  const currentDomain = getCurrentDomain();
  const redirectUri = `${currentDomain}/redirecturl`;
  console.log('🔧 Forced redirect URI (using current domain):', redirectUri);
  return redirectUri;
};

// Force production domain if we detect we're on a production host
export const getProductionSafeRedirectUri = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    console.log('🔧 Production safe - Current hostname:', hostname);
    console.log('🔧 Production safe - Current origin:', origin);
    console.log('🔧 Production safe - Environment:', import.meta.env.PROD ? 'Production' : 'Development');
    
    // If we're on a production domain (Render, Vercel, Netlify), force use it
    if (hostname.includes('onrender.com') || hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
      const productionDomain = `https://${hostname}`;
      const redirectUri = `${productionDomain}/redirecturl`;
      console.log('🔧 Production safe - Using production domain:', redirectUri);
      return redirectUri;
    }
    
    // If we're on localhost but in production build, use Render domain
    if (hostname.includes('localhost') && import.meta.env.PROD) {
      const renderDomain = 'https://compliance-manager-frontend.onrender.com';
      const redirectUri = `${renderDomain}/redirecturl`;
      console.log('🔧 Production safe - Using Render domain for localhost in production:', redirectUri);
      return redirectUri;
    }
  }
  
  // Fallback to normal domain detection
  return getForcedRedirectUri();
};

// Render-specific redirect URI (always use Render domain when deployed)
export const getRenderRedirectUri = (): string => {
  const renderDomain = 'https://compliance-manager-frontend.onrender.com';
  const redirectUri = `${renderDomain}/redirecturl`;
  console.log('🔧 Render redirect URI:', redirectUri);
  return redirectUri;
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