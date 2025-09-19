# 🔧 Backend Fixes Required for "Failed to fetch" Issue

## 🎯 **Backend Changes Needed**

The "Failed to fetch" error requires these specific backend fixes:

## 🛠️ **Fix #1: CORS Configuration**

### **Problem:** Backend not allowing requests from frontend domain

### **Solution:** Update CORS configuration in your backend

**File to modify:** `server.js` or `app.js` (main backend file)

```javascript
const cors = require('cors');

// CORS configuration - ADD THIS
const corsOptions = {
  origin: [
    'https://compliance-manager-frontend.onrender.com',
    'http://localhost:3001', // for development
    'http://localhost:3000', // alternative dev port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control', 
    'Pragma',
    'X-Requested-With',
    'Accept'
  ],
  optionsSuccessStatus: 200 // for legacy browser support
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));
```

## 🛠️ **Fix #2: Environment Variables**

### **Add these environment variables in Render Backend Service:**

```bash
# Frontend domain for CORS
FRONTEND_URL=https://compliance-manager-frontend.onrender.com
CORS_ORIGIN=https://compliance-manager-frontend.onrender.com

# Xero OAuth2 credentials (REQUIRED)
XERO_CLIENT_ID=your-xero-client-id-here
XERO_CLIENT_SECRET=your-xero-client-secret-here
XERO_REDIRECT_URI=https://compliance-manager-frontend.onrender.com/redirecturl

# Database and other configs
NODE_ENV=production
```

## 🛠️ **Fix #3: Xero Settings Endpoint**

### **Problem:** `/xero/settings` endpoint may be missing or not properly configured

### **Solution:** Ensure this endpoint exists in your backend

**File:** `routes/xero.js` or similar

```javascript
// GET /api/xero/settings - Required endpoint
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Xero settings request from:', req.get('origin'));
    
    // Check if Xero credentials are configured
    const hasCredentials = !!(
      process.env.XERO_CLIENT_ID && 
      process.env.XERO_CLIENT_SECRET
    );

    if (!hasCredentials) {
      return res.status(200).json({
        success: true,
        data: {
          hasCredentials: false,
          message: 'Xero credentials not configured'
        }
      });
    }

    // Return credential status (don't expose actual secrets)
    res.status(200).json({
      success: true,
      data: {
        client_id: process.env.XERO_CLIENT_ID?.substring(0, 8) + '...',
        client_secret: '••••••••••••••••',
        redirect_uri: process.env.XERO_REDIRECT_URI,
        hasCredentials: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Xero settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Xero settings',
      error: error.message
    });
  }
});
```

## 🛠️ **Fix #4: Authentication Middleware**

### **Ensure proper authentication middleware:**

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

## 🛠️ **Fix #5: Health Check Endpoint**

### **Ensure health check endpoint works:**

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cors_origin: process.env.CORS_ORIGIN,
    frontend_url: process.env.FRONTEND_URL
  });
});
```

## 🚀 **Deployment Steps**

### **1. Update Backend Code**
```bash
# In your backend repository
git add .
git commit -m "Fix CORS and Xero settings endpoint for frontend integration"
git push origin main
```

### **2. Set Environment Variables in Render**
Go to your **Backend Service** in Render Dashboard:

1. Navigate to **Environment** tab
2. Add/Update these variables:
```bash
FRONTEND_URL=https://compliance-manager-frontend.onrender.com
CORS_ORIGIN=https://compliance-manager-frontend.onrender.com
XERO_CLIENT_ID=your-actual-xero-client-id
XERO_CLIENT_SECRET=your-actual-xero-client-secret
XERO_REDIRECT_URI=https://compliance-manager-frontend.onrender.com/redirecturl
NODE_ENV=production
```

### **3. Verify Deployment**
After backend redeploys, test:
```bash
# Test health endpoint
curl https://compliance-manager-backend.onrender.com/api/health

# Test CORS headers
curl -H "Origin: https://compliance-manager-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization,content-type" \
     -X OPTIONS \
     https://compliance-manager-backend.onrender.com/api/xero/settings
```

## 🔍 **Testing the Fix**

### **1. Check CORS Headers**
The backend should return these headers:
```
Access-Control-Allow-Origin: https://compliance-manager-frontend.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,Cache-Control,Pragma
```

### **2. Test Xero Settings Endpoint**
```bash
# With valid token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://compliance-manager-backend.onrender.com/api/xero/settings
```

Expected response:
```json
{
  "success": true,
  "data": {
    "client_id": "a1b2c3d4...",
    "client_secret": "••••••••••••••••",
    "redirect_uri": "https://compliance-manager-frontend.onrender.com/redirecturl",
    "hasCredentials": true
  }
}
```

## ✅ **Expected Results**

After implementing these fixes:
1. ✅ No more "Failed to fetch" errors
2. ✅ CORS headers properly configured  
3. ✅ Xero settings endpoint responds correctly
4. ✅ Frontend can communicate with backend
5. ✅ Button shows "Connect to Xero" instead of "No Credentials Configured"

## 🚨 **Priority Order**

Implement fixes in this order:
1. **Fix #2** (Environment Variables) - CRITICAL
2. **Fix #1** (CORS Configuration) - CRITICAL  
3. **Fix #3** (Xero Settings Endpoint) - HIGH
4. **Fix #4** (Authentication) - MEDIUM
5. **Fix #5** (Health Check) - LOW

The first two fixes will likely resolve 90% of the "Failed to fetch" issues!
