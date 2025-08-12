// Domain configuration for production
export const DOMAIN_CONFIG = {
  // Replace this with your actual production domain
  PRODUCTION_DOMAIN: 'https://compliance-manager-frontend.onrender.com', // CHANGE THIS TO YOUR REAL DOMAIN
  
  // Development domain
  DEVELOPMENT_DOMAIN: 'http://localhost:3000',
  
  // Get the appropriate domain based on environment
  getDomain: (): string => {
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_FRONTEND_URL || DOMAIN_CONFIG.PRODUCTION_DOMAIN;
    }
    return DOMAIN_CONFIG.DEVELOPMENT_DOMAIN;
  },
  
  // Get the redirect URI for OAuth
  getRedirectUri: (): string => {
    return `${DOMAIN_CONFIG.getDomain()}/redirecturl`;
  }
};
