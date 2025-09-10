// Domain configuration for production
export const DOMAIN_CONFIG = {
  // Production domain for Render deployment
  PRODUCTION_DOMAIN: 'https://compliance-manager-frontend.onrender.com',
  
  // Development domain - will be dynamically determined
  DEVELOPMENT_DOMAIN: 'http://localhost:3000',
  
  // Get the appropriate domain based on environment
  getDomain: (): string => {
    if (import.meta.env.PROD) {
      // In production, prioritize environment variable, then use production domain
      const envDomain = import.meta.env.VITE_FRONTEND_URL;
      if (envDomain) {
        console.log('🔧 Using environment domain for production:', envDomain);
        return envDomain;
      }
      
      // Fallback to production domain
      console.log('🔧 Using default production domain:', DOMAIN_CONFIG.PRODUCTION_DOMAIN);
      return DOMAIN_CONFIG.PRODUCTION_DOMAIN;
    }
    
    // In development, use the actual window location to handle dynamic ports
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      console.log('🔧 Using current window origin for development:', currentOrigin);
      return currentOrigin;
    }
    
    return DOMAIN_CONFIG.DEVELOPMENT_DOMAIN;
  },
  
  // Get the redirect URI for OAuth
  getRedirectUri: (): string => {
    const domain = DOMAIN_CONFIG.getDomain();
    const redirectUri = `${domain}/redirecturl`;
    console.log('🔧 Generated redirect URI:', redirectUri);
    return redirectUri;
  }
};
