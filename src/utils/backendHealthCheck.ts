export const checkBackendHealth = async () => {
  const apiBase = import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';
  
  try {
    console.log('🔍 Checking backend health...');
    console.log('API Base URL:', apiBase);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${apiBase}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('Backend response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is healthy:', data);
      return {
        status: 'healthy',
        data,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log('⚠️ Backend returned error status:', response.status);
      return {
        status: 'error',
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    console.log('⚠️ Backend health check failed (this is expected if backend has CORS issues):', error.message);
    
    // Don't treat CORS/network errors as critical - they're expected
    const isCorsError = error.message.includes('fetch') || 
                       error.message.includes('CORS') || 
                       error.message.includes('NetworkError');
    
    return {
      status: isCorsError ? 'cors_issue' : 'unreachable',
      error: isCorsError ? 'CORS configuration needed on backend' : error.message,
      timestamp: new Date().toISOString(),
      note: isCorsError ? 'This is expected - use simplified integration instead' : undefined
    };
  }
};

export const testXeroEndpoints = async () => {
  const apiBase = import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';
  const token = localStorage.getItem('token');
  
  const results: any = {};
  
  // Test connections endpoint
  try {
    console.log('🔍 Testing Xero connections endpoint...');
    const response = await fetch(`${apiBase}/xero/connections`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    results.connections = {
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString()
    };
    
    if (response.ok) {
      const data = await response.json();
      results.connections.data = data;
    }
  } catch (error: any) {
    results.connections = {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  // Test login endpoint
  try {
    console.log('🔍 Testing Xero login endpoint...');
    const response = await fetch(`${apiBase}/xero/login`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    results.login = {
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString()
    };
    
    if (response.ok) {
      const data = await response.json();
      results.login.data = data;
    }
  } catch (error: any) {
    results.login = {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  console.log('📊 Xero endpoints test results:', results);
  return results;
};

export const runFullDiagnostic = async () => {
  console.group('🔧 Full Backend Diagnostic');
  
  const health = await checkBackendHealth();
  const xeroEndpoints = await testXeroEndpoints();
  
  const diagnostic = {
    health,
    xeroEndpoints,
    environment: {
      apiUrl: import.meta.env.VITE_API_URL,
      hasToken: !!localStorage.getItem('token'),
      tokenLength: localStorage.getItem('token')?.length,
      companyId: localStorage.getItem('companyId'),
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Diagnostic Results:', diagnostic);
  console.groupEnd();
  
  return diagnostic;
}; 