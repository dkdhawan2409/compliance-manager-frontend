# ⚡ Quick Backend Setup - Copy & Paste Ready

## 🔥 **URGENT: Backend Files to Create**

### **1. server.js (Main File) - Add CORS Configuration**

**Add this to the top of your main server file:**

```javascript
const cors = require('cors');

// CORS Configuration - ADD THIS
const corsOptions = {
  origin: [
    'https://compliance-manager-frontend.onrender.com',
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Health endpoint - ADD THIS
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    cors_origin: process.env.CORS_ORIGIN
  });
});
```

### **2. Create: routes/xero.js**

```javascript
const express = require('express');
const router = express.Router();

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  // Add your JWT verification here
  next();
};

// CRITICAL ENDPOINT - Xero Settings
router.get('/settings', authenticateToken, (req, res) => {
  const hasCredentials = !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET);
  
  res.json({
    success: true,
    data: {
      hasCredentials,
      client_id: hasCredentials ? process.env.XERO_CLIENT_ID?.substring(0, 8) + '...' : null,
      client_secret: hasCredentials ? '••••••••••••••••' : null,
      redirect_uri: process.env.XERO_REDIRECT_URI || 'https://compliance-manager-frontend.onrender.com/redirecturl'
    }
  });
});

module.exports = router;
```

### **3. Add to your main server file:**

```javascript
// Add this route
const xeroRoutes = require('./routes/xero'); // Adjust path as needed
app.use('/api/xero', xeroRoutes);
```

### **4. Install Dependencies:**

```bash
npm install cors
```

## 🔧 **Environment Variables (Render Backend)**

**Go to your backend service in Render → Environment tab → Add these:**

```
CORS_ORIGIN=https://compliance-manager-frontend.onrender.com
FRONTEND_URL=https://compliance-manager-frontend.onrender.com
XERO_CLIENT_ID=your-xero-client-id-here
XERO_CLIENT_SECRET=your-xero-client-secret-here
XERO_REDIRECT_URI=https://compliance-manager-frontend.onrender.com/redirecturl
NODE_ENV=production
```

## 🚀 **Deploy Commands:**

```bash
git add .
git commit -m "Add CORS and Xero settings endpoint"
git push origin main
```

## ✅ **Test After Deploy:**

```bash
curl https://compliance-manager-backend.onrender.com/api/health
```

**Should return:**
```json
{"success":true,"message":"API server is running"}
```

---

## 🎯 **That's It!**

These 4 steps will fix the "Failed to fetch" error:
1. ✅ Add CORS configuration 
2. ✅ Create Xero settings endpoint
3. ✅ Set environment variables
4. ✅ Deploy

**Frontend is already deployed and ready!** 🚀
