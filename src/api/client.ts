import axios from 'axios';

// Smart API URL detection for local vs production
const getSmartApiUrl = (): string => {
  // Check if we're running on a production domain
  const isProductionDomain = typeof window !== 'undefined' && 
    (window.location.hostname.includes('onrender.com') || 
     window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('netlify.app'));

  // If on production domain, always use production API
  if (isProductionDomain) {
    return 'https://compliance-manager-backend.onrender.com/api';
  }

  // If in production build but not on production domain (e.g., local production build)
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';
  }
  
  // Development mode - use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
};

const API_URL = getSmartApiUrl();

console.log('🔧 API Client initialized with URL:', API_URL);

// Production safety check
if (import.meta.env.PROD && API_URL.includes('localhost')) {
  console.error('❌ CRITICAL: Production build contains localhost URL:', API_URL);
  throw new Error('Production build cannot contain localhost URLs. Please set VITE_API_URL environment variable.');
}

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for OAuth operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log OAuth-related requests for debugging
    if (config.url?.includes('/xero/')) {
      console.log('🔐 Xero API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful OAuth responses
    if (response.config.url?.includes('/xero/')) {
      console.log('✅ Xero API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging for OAuth issues
    if (error.config?.url?.includes('/xero/')) {
      console.error('❌ Xero API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config.url,
        data: error.response?.data,
        message: error.message
      });
      
      // Provide specific error messages for common OAuth issues
      if (error.response?.status === 401) {
        console.error('🔐 Authentication failed - token may be expired or invalid');
      } else if (error.response?.status === 404) {
        console.error('🔍 OAuth endpoint not found - check backend implementation');
      } else if (error.response?.status === 500) {
        console.error('⚡ Server error - check backend logs for OAuth implementation');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
