# 🚨 Backend 404 Error Troubleshooting

## ❌ **Problem**
Still getting 404 error for `/api/xero/auto-allocate-all` even after adding code.

## 🔍 **Let's Troubleshoot Step by Step**

### **Step 1: Check Your Server File**

First, let's see what your current server file looks like. Can you show me:

1. **What's the name of your main server file?** (server.js, app.js, index.js, etc.)
2. **What does your current server file contain?**

### **Step 2: Minimal Working Solution**

Add this **exact code** to your main server file:

```javascript
// Add this EXACT code to your server.js (or whatever your main file is called)

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// The missing Xero endpoints
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
```

### **Step 3: Test the Server**

After adding the code above, test these URLs:

```bash
# Test 1: Check if server is working
curl http://localhost:3333/api/test

# Test 2: Test the auto-allocate endpoint
curl -X POST http://localhost:3333/api/xero/auto-allocate-all

# Test 3: Test the set-default-config endpoint
curl -X POST http://localhost:3333/api/xero/set-default-config \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","clientSecret":"test"}'
```

### **Step 4: Check Server Console**

When you restart your server, you should see:
```
🚀 Server running on port 3333
```

When you test the endpoints, you should see:
```
✅ Auto-allocate endpoint called!
✅ Set default config endpoint called!
```

## 🔧 **Common Issues & Solutions**

### **Issue 1: Server Not Restarted**
**Problem:** Added code but didn't restart server
**Solution:** 
```bash
# Stop server (Ctrl+C)
# Then restart
npm start
# or
node server.js
```

### **Issue 2: Wrong File**
**Problem:** Added code to wrong file
**Solution:** Make sure you're editing the main server file (usually server.js, app.js, or index.js)

### **Issue 3: Syntax Error**
**Problem:** Code has syntax errors
**Solution:** Check console for error messages when starting server

### **Issue 4: Port Mismatch**
**Problem:** Server running on different port
**Solution:** Check what port your server is actually running on

## 🧪 **Quick Test Script**

Create a file called `test-endpoints.js`:

```javascript
const http = require('http');

// Test the endpoints
function testEndpoint(path, method = 'GET', data = null) {
  const options = {
    hostname: 'localhost',
    port: 3333,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\n${method} ${path} - Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Error testing ${path}:`, error.message);
  });

  if (data) {
    req.write(JSON.stringify(data));
  }
  
  req.end();
}

// Test all endpoints
console.log('🧪 Testing endpoints...');

testEndpoint('/api/test');
testEndpoint('/api/xero/auto-allocate-all', 'POST');
testEndpoint('/api/xero/set-default-config', 'POST', {
  clientId: 'test',
  clientSecret: 'test'
});
```

Run it with:
```bash
node test-endpoints.js
```

## 📋 **Checklist**

Before testing, make sure:

- [ ] ✅ Server is running on port 3333
- [ ] ✅ Code is added to the correct server file
- [ ] ✅ Server was restarted after adding code
- [ ] ✅ No syntax errors in server console
- [ ] ✅ Endpoints are added before `app.listen()`

## 🚨 **If Still Not Working**

If you're still getting 404 errors, please share:

1. **Your server file content** (the main file that starts the server)
2. **Server console output** when you start it
3. **Any error messages** you see
4. **The exact command** you use to start your server

## 🎯 **Expected Results**

After adding the code and restarting:

```bash
# This should work:
curl http://localhost:3333/api/test
# Response: {"message":"Server is working!"}

# This should work:
curl -X POST http://localhost:3333/api/xero/auto-allocate-all
# Response: {"success":true,"message":"Auto-allocated Xero settings to 0 companies",...}
```

**Let me know what you see when you test these endpoints!** 🚀



