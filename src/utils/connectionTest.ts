// Connection testing utility for diagnosing backend issues

import { getApiUrl } from './envChecker';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details: any;
  timestamp: string;
}

export const testBackendConnection = async (): Promise<ConnectionTestResult> => {
  const timestamp = new Date().toISOString();
  const apiUrl = getApiUrl();
  
  try {
    console.log('🔍 Testing backend connection to:', apiUrl);
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Backend connection successful',
        details: {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        },
        timestamp
      };
    } else {
      return {
        success: false,
        message: `Backend returned error: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        },
        timestamp
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        apiUrl: apiUrl
      },
      timestamp
    };
  }
};

export const testAuthenticatedRequest = async (): Promise<ConnectionTestResult> => {
  const timestamp = new Date().toISOString();
  const apiUrl = getApiUrl();
  const token = localStorage.getItem('token');
  
  if (!token) {
    return {
      success: false,
      message: 'No authentication token found',
      details: { reason: 'No token in localStorage' },
      timestamp
    };
  }
  
  try {
    console.log('🔍 Testing authenticated request to:', `${apiUrl}/xero/settings`);
    
    const response = await fetch(`${apiUrl}/xero/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Authenticated request successful',
        details: {
          status: response.status,
          statusText: response.statusText,
          data: data,
          tokenLength: token.length,
          tokenPreview: `${token.substring(0, 10)}...`
        },
        timestamp
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Authenticated request failed: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText,
          tokenLength: token.length,
          tokenPreview: `${token.substring(0, 10)}...`
        },
        timestamp
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Authenticated request error: ${error.message}`,
      details: {
        name: error.name,
        message: error.message,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 10)}...`,
        apiUrl: apiUrl
      },
      timestamp
    };
  }
};

export const runFullDiagnostic = async () => {
  console.log('🚀 Running full backend diagnostic...');
  
  const results = {
    environment: {
      isProd: import.meta.env.PROD,
      mode: import.meta.env.MODE,
      viteApiUrl: import.meta.env.VITE_API_URL,
      calculatedApiUrl: getApiUrl(),
      currentDomain: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'N/A'
    },
    backendConnection: await testBackendConnection(),
    authenticatedRequest: await testAuthenticatedRequest(),
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Diagnostic Results:', results);
  
  // Provide recommendations
  if (!results.backendConnection.success) {
    console.error('❌ Backend connection failed - check CORS configuration');
  }
  
  if (!results.authenticatedRequest.success) {
    if (results.authenticatedRequest.details.status === 401) {
      console.error('❌ Authentication failed - token may be expired');
    } else if (results.authenticatedRequest.details.status === 404) {
      console.error('❌ Xero settings endpoint not found - check backend implementation');
    }
  }
  
  return results;
};
