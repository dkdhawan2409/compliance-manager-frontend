// Comprehensive test utility for Xero environment configuration

import { getApiUrl, getCurrentDomain } from './envChecker';

export interface XeroEnvironmentTest {
  environment: {
    hostname: string;
    origin: string;
    isLocal: boolean;
    isProduction: boolean;
    buildMode: string;
  };
  apiConfiguration: {
    calculatedApiUrl: string;
    expectedApiUrl: string;
    isCorrect: boolean;
  };
  redirectConfiguration: {
    calculatedRedirectUri: string;
    expectedRedirectUri: string;
    isCorrect: boolean;
  };
  environmentVariables: {
    viteApiUrl: string | undefined;
    viteFrontendUrl: string | undefined;
  };
  recommendations: string[];
  status: 'correct' | 'needs_fix' | 'warning';
}

export const testXeroEnvironment = (): XeroEnvironmentTest => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const isLocal = hostname.includes('localhost');
  const isProduction = hostname.includes('onrender.com') || hostname.includes('vercel.app') || hostname.includes('netlify.app');
  const buildMode = import.meta.env.PROD ? 'production' : 'development';

  // Calculate expected URLs
  const calculatedApiUrl = getApiUrl();
  const expectedApiUrl = isLocal 
    ? 'http://localhost:3333/api'
    : 'https://compliance-manager-backend.onrender.com/api';

  const calculatedRedirectUri = `${origin}/redirecturl`;
  const expectedRedirectUri = isLocal
    ? `${window.location.origin}/redirecturl`
    : 'https://compliance-manager-frontend.onrender.com/redirecturl';

  // Check if configuration is correct
  const apiIsCorrect = calculatedApiUrl === expectedApiUrl;
  const redirectIsCorrect = calculatedRedirectUri === expectedRedirectUri;

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!apiIsCorrect) {
    recommendations.push(`API URL mismatch: Expected ${expectedApiUrl}, got ${calculatedApiUrl}`);
  }
  
  if (!redirectIsCorrect) {
    recommendations.push(`Redirect URI mismatch: Expected ${expectedRedirectUri}, got ${calculatedRedirectUri}`);
  }

  if (isLocal && buildMode === 'production') {
    recommendations.push('Running production build locally - this is OK for testing');
  }

  if (isProduction && !import.meta.env.PROD) {
    recommendations.push('Running development build on production domain - consider using production build');
  }

  if (isLocal && !import.meta.env.VITE_API_URL) {
    recommendations.push('Consider setting VITE_API_URL=http://localhost:3333/api in .env.local for explicit local configuration');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Environment configuration is correct!');
  }

  // Determine overall status
  let status: 'correct' | 'needs_fix' | 'warning' = 'correct';
  if (!apiIsCorrect || !redirectIsCorrect) {
    status = 'needs_fix';
  } else if (recommendations.length > 1) {
    status = 'warning';
  }

  return {
    environment: {
      hostname,
      origin,
      isLocal,
      isProduction,
      buildMode
    },
    apiConfiguration: {
      calculatedApiUrl,
      expectedApiUrl,
      isCorrect: apiIsCorrect
    },
    redirectConfiguration: {
      calculatedRedirectUri,
      expectedRedirectUri,
      isCorrect: redirectIsCorrect
    },
    environmentVariables: {
      viteApiUrl: import.meta.env.VITE_API_URL,
      viteFrontendUrl: import.meta.env.VITE_FRONTEND_URL
    },
    recommendations,
    status
  };
};

export const logXeroEnvironmentTest = (): XeroEnvironmentTest => {
  const testResult = testXeroEnvironment();
  
  console.group('🔍 Xero Environment Configuration Test');
  
  // Environment info
  console.log('🌍 Environment:', testResult.environment);
  
  // API configuration
  if (testResult.apiConfiguration.isCorrect) {
    console.log('✅ API URL:', testResult.apiConfiguration.calculatedApiUrl);
  } else {
    console.error('❌ API URL Issue:', testResult.apiConfiguration);
  }
  
  // Redirect configuration
  if (testResult.redirectConfiguration.isCorrect) {
    console.log('✅ Redirect URI:', testResult.redirectConfiguration.calculatedRedirectUri);
  } else {
    console.error('❌ Redirect URI Issue:', testResult.redirectConfiguration);
  }
  
  // Environment variables
  console.log('🔧 Environment Variables:', testResult.environmentVariables);
  
  // Recommendations
  console.log('💡 Recommendations:', testResult.recommendations);
  
  // Overall status
  if (testResult.status === 'correct') {
    console.log('🎉 Overall Status: ✅ CORRECT');
  } else if (testResult.status === 'warning') {
    console.warn('⚠️ Overall Status: WARNING');
  } else {
    console.error('❌ Overall Status: NEEDS FIX');
  }
  
  console.groupEnd();
  
  return testResult;
};

// Auto-run test in development mode
if (import.meta.env.DEV) {
  // Run test after a short delay to ensure DOM is ready
  setTimeout(() => {
    logXeroEnvironmentTest();
  }, 1000);
}
