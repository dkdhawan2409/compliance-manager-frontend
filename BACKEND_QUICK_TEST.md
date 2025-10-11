# 🧪 Backend Quick Test Guide

## 🚨 **Problem**
Getting 404 error for `/api/xero/set-default-config` endpoint.

## ✅ **Quick Solution**
Add a simple test endpoint to verify the backend is working.

## 📂 **Add This to Your server.js or app.js**

```javascript
// Add this test endpoint to your main server file
app.post('/api/xero/set-default-config', (req, res) => {
  console.log('🔧 Test endpoint called:', req.body);
  
  res.status(200).json({
    success: true,
    message: 'Test endpoint working! Default Xero configuration saved.',
    data: {
      clientId: req.body.clientId ? req.body.clientId.substring(0, 8) + '...' : 'not provided',
      redirectUri: req.body.redirectUri || 'default',
      allocatedCount: 0,
      totalCompanies: 0
    }
  });
});

// Add this test endpoint for auto-allocate
app.post('/api/xero/auto-allocate-all', (req, res) => {
  console.log('🔄 Auto-allocate test endpoint called');
  
  res.status(200).json({
    success: true,
    message: 'Test endpoint working! Auto-allocated Xero settings.',
    data: {
      allocatedCount: 0,
      totalCompanies: 0,
      failedCount: 0
    }
  });
});
```

## 🧪 **Test the Endpoints**

### **Test 1: Set Default Config**
```bash
curl -X POST http://localhost:3333/api/xero/set-default-config \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test-client-id","clientSecret":"test-secret","redirectUri":"http://localhost:3001/redirecturl"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test endpoint working! Default Xero configuration saved.",
  "data": {
    "clientId": "test-clie...",
    "redirectUri": "http://localhost:3001/redirecturl",
    "allocatedCount": 0,
    "totalCompanies": 0
  }
}
```

### **Test 2: Auto-Allocate**
```bash
curl -X POST http://localhost:3333/api/xero/auto-allocate-all \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test endpoint working! Auto-allocated Xero settings.",
  "data": {
    "allocatedCount": 0,
    "totalCompanies": 0,
    "failedCount": 0
  }
}
```

## 🔧 **If You're Using Express Router**

If you're using separate route files, create `routes/xero.js`:

```javascript
const express = require('express');
const router = express.Router();

// Test endpoint for set-default-config
router.post('/set-default-config', (req, res) => {
  console.log('🔧 Test endpoint called:', req.body);
  
  res.status(200).json({
    success: true,
    message: 'Test endpoint working! Default Xero configuration saved.',
    data: {
      clientId: req.body.clientId ? req.body.clientId.substring(0, 8) + '...' : 'not provided',
      redirectUri: req.body.redirectUri || 'default',
      allocatedCount: 0,
      totalCompanies: 0
    }
  });
});

// Test endpoint for auto-allocate-all
router.post('/auto-allocate-all', (req, res) => {
  console.log('🔄 Auto-allocate test endpoint called');
  
  res.status(200).json({
    success: true,
    message: 'Test endpoint working! Auto-allocated Xero settings.',
    data: {
      allocatedCount: 0,
      totalCompanies: 0,
      failedCount: 0
    }
  });
});

module.exports = router;
```

Then in your main server file, add:
```javascript
const xeroRoutes = require('./routes/xero');
app.use('/api/xero', xeroRoutes);
```

## 🚀 **Quick Steps**

1. **Add the test endpoints** to your backend
2. **Restart your backend server**
3. **Test with curl** to verify endpoints work
4. **Try the frontend** - it should now work without 404 errors

## ✅ **Expected Results**

After adding these test endpoints:
- ✅ No more 404 errors
- ✅ Frontend can call the endpoints
- ✅ You'll see success messages in the frontend
- ✅ Backend logs will show the requests

**This is a quick fix to get the system working while you implement the full database functionality!** 🚀











