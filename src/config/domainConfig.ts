// Domain configuration for production
export const DOMAIN_CONFIG = {
  // Production domain for Render deployment
  PRODUCTION_DOMAIN: 'https://compliance-manager-frontend.onrender.com',
  
  // Development domain - will be dynamically determined
  DEVELOPMENT_DOMAIN: 'http://localhost:3000',
  
  // Get the appropriate domain based on environment
  getDomain: (): string => {
    // Always check window.location.origin first (most reliable)
    if (typeof window !== 'undefined') {
      const windowDomain = window.location.origin;
      console.log('🔧 DomainConfig - Window domain detected:', windowDomain);
      
      // If we're on a production domain, use it
      if (windowDomain.includes('onrender.com') || windowDomain.includes('vercel.app') || windowDomain.includes('netlify.app')) {
        console.log('🔧 DomainConfig - Using production window domain:', windowDomain);
        return windowDomain;
      }
      
      // If we're on localhost, use it for development
      if (windowDomain.includes('localhost')) {
        console.log('🔧 DomainConfig - Using localhost domain for development:', windowDomain);
        return windowDomain;
      }
    }
    
    // In production, prioritize environment variable
    if (import.meta.env.PROD) {
      const envDomain = import.meta.env.VITE_FRONTEND_URL;
      if (envDomain) {
        console.log('🔧 DomainConfig - Using environment domain for production:', envDomain);
        return envDomain;
      }
      
      // Fallback to production domain
      console.log('🔧 DomainConfig - Using default production domain:', DOMAIN_CONFIG.PRODUCTION_DOMAIN);
      return DOMAIN_CONFIG.PRODUCTION_DOMAIN;
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
