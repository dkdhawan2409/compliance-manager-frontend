# 🔧 Backend Files to Create/Modify

## 📂 **File 1: server.js or app.js (Main Server File)**

**Location:** Root of your backend project
**Action:** Add CORS configuration

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration - ADD THIS SECTION
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
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Your existing middleware and routes...
app.use(express.json());

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

// Your existing routes...
// app.use('/api/xero', xeroRoutes);
// app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});
```

## 📂 **File 2: routes/xero.js (Xero Routes)**

**Location:** `routes/xero.js` or `src/routes/xero.js`
**Action:** Create or update with Xero settings endpoint

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // Adjust path as needed

// GET /api/xero/settings - CRITICAL ENDPOINT
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Xero settings request from:', req.get('origin'));
    console.log('🔍 User ID:', req.user?.id);
    
    // Check if Xero credentials are configured in environment
    const hasCredentials = !!(
      process.env.XERO_CLIENT_ID && 
      process.env.XERO_CLIENT_SECRET
    );

    console.log('🔍 Credentials check:', {
      hasClientId: !!process.env.XERO_CLIENT_ID,
      hasClientSecret: !!process.env.XERO_CLIENT_SECRET,
      hasCredentials
    });

    if (!hasCredentials) {
      return res.status(200).json({
        success: true,
        data: {
          hasCredentials: false,
          message: 'Xero OAuth2 credentials not configured. Please set XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.'
        }
      });
    }

    // Return credential status (don't expose actual secrets)
    res.status(200).json({
      success: true,
      data: {
        client_id: process.env.XERO_CLIENT_ID?.substring(0, 8) + '...',
        client_secret: '••••••••••••••••',
        redirect_uri: process.env.XERO_REDIRECT_URI || 'https://compliance-manager-frontend.onrender.com/redirecturl',
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

// GET /api/xero/connect - OAuth initiation endpoint
router.get('/connect', authenticateToken, async (req, res) => {
  try {
    // Check if credentials are configured
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        message: 'Xero OAuth2 credentials not configured'
      });
    }

    // Generate OAuth URL (implement your OAuth logic here)
    const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${process.env.XERO_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.XERO_REDIRECT_URI)}&scope=offline_access accounting.transactions accounting.contacts&state=${generateState()}`;

    res.json({
      success: true,
      data: {
        authUrl: authUrl
      }
    });

  } catch (error) {
    console.error('❌ Error generating OAuth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OAuth URL',
      error: error.message
    });
  }
});

// Helper function to generate OAuth state
function generateState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

module.exports = router;
```

## 📂 **File 3: middleware/auth.js (Authentication Middleware)**

**Location:** `middleware/auth.js` or `src/middleware/auth.js`
**Action:** Create authentication middleware

```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided in request');
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    console.log('✅ Token verified for user:', user.id || user.userId);
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

## 📂 **File 4: package.json Dependencies**

**Location:** Root of backend project
**Action:** Ensure these dependencies are installed

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0"
  }
}
```

**Install command:**
```bash
npm install express cors jsonwebtoken
```

## 🔧 **Environment Variables for Render**

**Location:** Render Backend Service Dashboard → Environment Tab

```bash
# CORS Configuration
FRONTEND_URL=https://compliance-manager-frontend.onrender.com
CORS_ORIGIN=https://compliance-manager-frontend.onrender.com

# Xero OAuth2 Configuration
XERO_CLIENT_ID=your-xero-client-id-from-developer-portal
XERO_CLIENT_SECRET=your-xero-client-secret-from-developer-portal
XERO_REDIRECT_URI=https://compliance-manager-frontend.onrender.com/redirecturl

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here

# General
NODE_ENV=production
PORT=3333
```

## 🚀 **Deployment Steps**

1. **Copy the code above** into the respective files in your backend repository
2. **Install dependencies:** `npm install express cors jsonwebtoken`
3. **Set environment variables** in Render Backend Service
4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add CORS configuration and Xero settings endpoint"
   git push origin main
   ```
5. **Wait for Render to deploy** (~3-5 minutes)

## ✅ **Testing After Deployment**

Test the endpoints:
```bash
# Test health endpoint
curl https://compliance-manager-backend.onrender.com/api/health

# Test CORS headers
curl -H "Origin: https://compliance-manager-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization,content-type" \
     -X OPTIONS \
     https://compliance-manager-backend.onrender.com/api/xero/settings

# Test settings endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://compliance-manager-backend.onrender.com/api/xero/settings
```

## 🎯 **Expected Results**

After implementing these files:
- ✅ No more "Failed to fetch" errors
- ✅ CORS headers properly configured
- ✅ Xero settings endpoint responds correctly
- ✅ Button shows "Connect to Xero" instead of "No Credentials Configured"

**These are the exact files you need to create/modify in your backend repository!**
