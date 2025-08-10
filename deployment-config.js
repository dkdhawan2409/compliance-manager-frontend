// Deployment Configuration for Production
// Update these values for your production server

const DEPLOYMENT_CONFIG = {
  // Production Backend API URL
  PRODUCTION_API_URL: 'https://compliance-manager-backend.onrender.com/api',
  
  // Development API URL (for local testing)
  DEVELOPMENT_API_URL: 'http://localhost:3333/api',
  
  // Frontend Port
  FRONTEND_PORT: 3001,
  
  // Backend Port
  BACKEND_PORT: 3333,
  
  // Environment Detection
  isProduction: () => import.meta.env.PROD,
  isDevelopment: () => import.meta.env.DEV,
  
  // Get API URL based on environment
  getApiUrl: () => {
    if (import.meta.env.PROD) {
      return DEPLOYMENT_CONFIG.PRODUCTION_API_URL;
    }
    return DEPLOYMENT_CONFIG.DEVELOPMENT_API_URL;
  }
};

// Instructions for deployment:
console.log('🚀 DEPLOYMENT INSTRUCTIONS:');
console.log('');
console.log('1. Update PRODUCTION_API_URL in deployment-config.js');
console.log('2. Set environment variables in your hosting platform:');
console.log('   - VITE_API_URL=https://your-backend-server.com/api');
console.log('3. Build the application: npm run build');
console.log('4. Deploy the dist/ folder to your hosting platform');
console.log('');
console.log('🔧 Current Configuration:');
console.log('   - Frontend Port:', DEPLOYMENT_CONFIG.FRONTEND_PORT);
console.log('   - Backend Port:', DEPLOYMENT_CONFIG.BACKEND_PORT);
console.log('   - Production API URL:', DEPLOYMENT_CONFIG.PRODUCTION_API_URL);
console.log('   - Development API URL:', DEPLOYMENT_CONFIG.DEVELOPMENT_API_URL);

export default DEPLOYMENT_CONFIG;
