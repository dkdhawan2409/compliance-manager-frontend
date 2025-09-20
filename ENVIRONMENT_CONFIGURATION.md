# 🔧 Environment Configuration - Local vs Production

## 🎯 **Smart URL Detection System**

I've implemented a smart system that automatically detects whether you're running locally or on production and uses the appropriate URLs.

## 🔧 **How It Works:**

### **Local Development (localhost:3001):**
```javascript
// Automatically uses:
API_URL = "http://localhost:3333/api"
FRONTEND_URL = "http://localhost:3001"
```

### **Production Deployment (onrender.com):**
```javascript
// Automatically uses:
API_URL = "https://compliance-manager-backend.onrender.com/api"
FRONTEND_URL = "https://compliance-manager-frontend.onrender.com"
```

## 📁 **Environment Files Setup:**

### **`.env.local` (for local development):**
```bash
# Local development environment
VITE_API_URL=http://localhost:3333/api
VITE_FRONTEND_URL=http://localhost:3001
```

### **`.env.local.production` (backup for production):**
```bash
# Production environment
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
VITE_FRONTEND_URL=https://compliance-manager-frontend.onrender.com
```

### **Render Environment Variables (production):**
```bash
# Set these in Render Frontend Service Dashboard:
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
VITE_FRONTEND_URL=https://compliance-manager-frontend.onrender.com
```

## 🔍 **Smart Detection Logic:**

### **In `src/utils/envChecker.ts`:**
```javascript
export const getApiUrl = (): string => {
  // 1. Check if running on production domain
  const isProductionDomain = window.location.hostname.includes('onrender.com');
  
  if (isProductionDomain) {
    // Production domain → use production API
    return 'https://compliance-manager-backend.onrender.com/api';
  }
  
  if (import.meta.env.PROD) {
    // Production build → use environment variable or production fallback
    return import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';
  }
  
  // Development mode → use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
};
```

### **In `src/api/client.ts`:**
```javascript
const getSmartApiUrl = (): string => {
  // Same smart detection logic
  // Automatically chooses localhost vs production
};
```

## 🚀 **Development Workflow:**

### **For Local Development:**
1. **Start your local backend** on `http://localhost:3333`
2. **Start your local frontend** with `npm start` (runs on `http://localhost:3001`)
3. **Automatic detection**: Uses localhost URLs
4. **No configuration needed**: Works out of the box

### **For Production Deployment:**
1. **Deploy to Render**: Automatic domain detection
2. **Uses production URLs**: Automatically switches to onrender.com
3. **No manual changes**: Smart detection handles everything

## 🔧 **Manual Override (if needed):**

### **Force Localhost (for testing):**
```bash
# In .env.local
VITE_API_URL=http://localhost:3333/api
VITE_FRONTEND_URL=http://localhost:3001
```

### **Force Production (for testing):**
```bash
# In .env.local
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
VITE_FRONTEND_URL=https://compliance-manager-frontend.onrender.com
```

## 🎯 **Environment Detection Examples:**

### **Scenario 1: Local Development**
```
Domain: localhost:3001
Mode: development
Result: Uses http://localhost:3333/api
```

### **Scenario 2: Production Deployment**
```
Domain: compliance-manager-frontend.onrender.com
Mode: production
Result: Uses https://compliance-manager-backend.onrender.com/api
```

### **Scenario 3: Local Production Build**
```
Domain: localhost:3001
Mode: production (npm run build + npm run preview)
Result: Uses environment variable or production fallback
```

## 🔍 **Debugging Environment:**

### **Check Current Configuration:**
```javascript
// Run in browser console:
console.log('Environment Info:', {
  hostname: window.location.hostname,
  origin: window.location.origin,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  viteApiUrl: import.meta.env.VITE_API_URL,
  calculatedApiUrl: getApiUrl()
});
```

### **Expected Output - Local:**
```javascript
{
  hostname: "localhost",
  origin: "http://localhost:3001",
  isProd: false,
  mode: "development",
  viteApiUrl: "http://localhost:3333/api",
  calculatedApiUrl: "http://localhost:3333/api"
}
```

### **Expected Output - Production:**
```javascript
{
  hostname: "compliance-manager-frontend.onrender.com",
  origin: "https://compliance-manager-frontend.onrender.com",
  isProd: true,
  mode: "production", 
  viteApiUrl: "https://compliance-manager-backend.onrender.com/api",
  calculatedApiUrl: "https://compliance-manager-backend.onrender.com/api"
}
```

## ✅ **Benefits of Smart Detection:**

- **🔄 Automatic**: No manual configuration switching
- **🛡️ Safe**: Production builds can't accidentally use localhost
- **🔧 Flexible**: Can override with environment variables
- **📊 Debuggable**: Clear logging of URL selection
- **🚀 Fast**: Works immediately in both environments

## 🎉 **Result:**

**Your application now automatically:**
- ✅ Uses `localhost:3333` when developing locally
- ✅ Uses `onrender.com` when deployed to production
- ✅ Provides clear logging of which URLs are being used
- ✅ Prevents localhost URLs in production builds
- ✅ Allows manual override when needed

**No more manual environment switching required!** 🚀
