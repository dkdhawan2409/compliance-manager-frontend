# 🔧 Backend Code to Copy - Complete Implementation

## 📂 **Step 1: Main Server File (server.js or app.js)**

**Location**: Root of your backend repository
**Action**: Add this CORS configuration

```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// CORS Configuration - CRITICAL FIX
const corsOptions = {
  origin: [
    'https://compliance-manager-frontend.onrender.com',
    'http://localhost:3001',
    'http://localhost:3000'
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
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  
  jwt.verify(token, jwtSecret, (err, user) => {
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

// Xero Settings Endpoint - CRITICAL
app.get('/api/xero/settings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Xero settings request from:', req.get('origin'));
    
    // Check if Xero credentials are configured
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
          message: 'Xero OAuth2 credentials not configured'
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

// Xero Connect Endpoint
app.get('/api/xero/connect', authenticateToken, async (req, res) => {
  try {
    // Check if credentials are configured
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        message: 'Xero OAuth2 credentials not configured'
      });
    }

    // Generate state for security
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    // Generate OAuth URL
    const authUrl = `https://login.xero.com/identity/connect/authorize?` +
                   `response_type=code&` +
                   `client_id=${process.env.XERO_CLIENT_ID}&` +
                   `redirect_uri=${encodeURIComponent(process.env.XERO_REDIRECT_URI)}&` +
                   `scope=${encodeURIComponent('offline_access accounting.transactions accounting.contacts accounting.settings')}&` +
                   `state=${state}`;

    res.json({
      success: true,
      data: {
        authUrl: authUrl,
        state: state
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

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${corsOptions.origin.join(', ')}`);
  console.log(`🔑 Xero Client ID: ${process.env.XERO_CLIENT_ID ? 'Configured' : 'Not set'}`);
  console.log(`🔐 Xero Client Secret: ${process.env.XERO_CLIENT_SECRET ? 'Configured' : 'Not set'}`);
});

module.exports = app;
```

## 📂 **Step 2: Package.json Dependencies**

**Add these to your backend package.json:**

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0"
  }
}
```

## 📂 **Step 3: Environment Variables**

**Set these in Render Backend Service Dashboard:**

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

## 🚀 **Deployment Commands**

**Run these in your backend repository:**

```bash
# Install dependencies
npm install express cors jsonwebtoken

# Add all files
git add .

# Commit changes
git commit -m "Add CORS configuration and Xero settings endpoint to fix Failed to fetch errors

- Added CORS middleware with proper origin configuration
- Created /api/xero/settings endpoint for credential checking
- Created /api/xero/connect endpoint for OAuth URL generation
- Added authentication middleware
- Enhanced error handling and logging
- Fixed Failed to fetch issues from frontend"

# Push to deploy
git push origin main
```

## 🔍 **Testing Commands**

**After deployment, test with these:**

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

## ✅ **Expected Results**

After deployment:
1. ✅ Health endpoint returns success
2. ✅ CORS headers properly configured
3. ✅ Xero settings endpoint responds correctly
4. ✅ No more "Failed to fetch" errors
5. ✅ Frontend can switch to "Full Integration" mode

---

## 🎯 **Quick Setup Summary**

1. **Copy the server code** above to your backend repository
2. **Install dependencies**: `npm install express cors jsonwebtoken`
3. **Set environment variables** in Render Backend Dashboard
4. **Commit and push**: `git push origin main`
5. **Wait 3-5 minutes** for deployment
6. **Test endpoints** with curl commands above

**This will completely fix the backend issues and make both integration versions work!** 🚀
