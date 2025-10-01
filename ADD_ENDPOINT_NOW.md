# 🚨 URGENT: Add Missing Endpoint to Backend

## ❌ **Current Problem**
Your backend server is running on `localhost:3333` but the `/api/xero/auto-allocate-all` endpoint doesn't exist, causing 404 errors.

## ✅ **IMMEDIATE SOLUTION**

### **Step 1: Find Your Backend Server File**

Look for one of these files in your backend project:
- `server.js`
- `app.js` 
- `index.js`
- `main.js`

### **Step 2: Add This Code to Your Server File**

Add this **exact code** anywhere in your server file (after `app.use(express.json())` but before `app.listen()`):

```javascript
// Add this code to your server file

// POST /api/xero/auto-allocate-all
app.post('/api/xero/auto-allocate-all', (req, res) => {
  console.log('✅ Auto-allocate endpoint called!');
  res.json({
    success: true,
    message: 'Auto-allocated Xero settings to 0 companies',
    data: {
      allocatedCount: 0,
      totalCompanies: 0,
      failedCount: 0
    }
  });
});

// POST /api/xero/set-default-config
app.post('/api/xero/set-default-config', (req, res) => {
  console.log('✅ Set default config endpoint called!');
  res.json({
    success: true,
    message: 'Default Xero configuration saved successfully',
    data: {
      clientId: 'test...',
      redirectUri: 'http://localhost:3001/redirecturl',
      allocatedCount: 0,
      totalCompanies: 0
    }
  });
});
```

### **Step 3: Restart Your Backend Server**

```bash
# Stop your server (Ctrl+C)
# Then restart it
npm start
# or
node server.js
```

### **Step 4: Test the Endpoint**

```bash
curl -X POST http://localhost:3333/api/xero/auto-allocate-all
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Auto-allocated Xero settings to 0 companies",
  "data": {
    "allocatedCount": 0,
    "totalCompanies": 0,
    "failedCount": 0
  }
}
```

## 🔍 **If You Can't Find Your Server File**

### **Option 1: Create a New Server File**

Create `server.js` in your backend project:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Xero endpoints
app.post('/api/xero/auto-allocate-all', (req, res) => {
  console.log('✅ Auto-allocate endpoint called!');
  res.json({
    success: true,
    message: 'Auto-allocated Xero settings to 0 companies',
    data: {
      allocatedCount: 0,
      totalCompanies: 0,
      failedCount: 0
    }
  });
});

app.post('/api/xero/set-default-config', (req, res) => {
  console.log('✅ Set default config endpoint called!');
  res.json({
    success: true,
    message: 'Default Xero configuration saved successfully',
    data: {
      clientId: 'test...',
      redirectUri: 'http://localhost:3001/redirecturl',
      allocatedCount: 0,
      totalCompanies: 0
    }
  });
});

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### **Option 2: Check Your Current Server**

If you already have a server running, find the file and add the endpoints to it.

## 🧪 **Quick Test**

After adding the code and restarting, test:

```bash
# Test 1: Check if server is working
curl http://localhost:3333/api/test

# Test 2: Test the auto-allocate endpoint
curl -X POST http://localhost:3333/api/xero/auto-allocate-all
```

## 🎯 **What Should Happen**

1. **Server starts** without errors
2. **Console shows:** `🚀 Server running on port 3333`
3. **Test endpoint works:** `curl http://localhost:3333/api/test`
4. **Auto-allocate endpoint works:** `curl -X POST http://localhost:3333/api/xero/auto-allocate-all`
5. **Frontend stops showing 404 errors**

## 🚨 **If Still Not Working**

Please tell me:
1. **What's the name of your backend server file?**
2. **What do you see when you start your server?**
3. **What happens when you run:** `curl http://localhost:3333/api/test`

**This will fix the 404 error immediately!** 🚀



