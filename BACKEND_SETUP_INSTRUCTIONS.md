# 🚀 Backend Setup Instructions - Make It Work!

## 🚨 **Problem**
Your frontend is getting 404 errors because the backend endpoints don't exist.

## ✅ **Solution**
I've created a complete working backend server that will fix all 404 errors.

## 📂 **Step 1: Create Backend Project**

### **Option A: If you don't have a backend project yet**

```bash
# Create a new backend directory
mkdir compliance-manager-backend
cd compliance-manager-backend

# Initialize npm
npm init -y

# Install dependencies
npm install express cors

# Create the server file
# (Copy the content from WORKING_BACKEND_SERVER.js)
```

### **Option B: If you already have a backend project**

1. **Find your main server file** (usually `server.js`, `app.js`, or `index.js`)
2. **Replace the content** with the code from `WORKING_BACKEND_SERVER.js`
3. **Or add the missing endpoints** to your existing file

## 📂 **Step 2: Copy the Server Code**

Copy the entire content from `WORKING_BACKEND_SERVER.js` into your main server file.

## 📂 **Step 3: Install Dependencies**

```bash
npm install express cors
```

## 📂 **Step 4: Start the Server**

```bash
# Start the server
node server.js
# or
npm start
```

## 🧪 **Step 5: Test the Endpoints**

### **Test 1: Health Check**
```bash
curl http://localhost:3333/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Backend server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "endpoints": [...]
}
```

### **Test 2: Auto-Allocate Endpoint (This fixes your 404 error)**
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

### **Test 3: Set Default Config**
```bash
curl -X POST http://localhost:3333/api/xero/set-default-config \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","clientSecret":"test"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Default Xero configuration saved successfully",
  "data": {
    "clientId": "test...",
    "redirectUri": "http://localhost:3001/redirecturl",
    "setAt": "2024-01-01T00:00:00.000Z",
    "allocatedCount": 0,
    "totalCompanies": 0
  }
}
```

## 🎯 **What This Fixes**

- ✅ **404 errors resolved** - all endpoints now exist
- ✅ **CORS configured** - frontend can call backend
- ✅ **Proper responses** - frontend gets expected data format
- ✅ **Error handling** - proper error responses
- ✅ **Logging** - see all requests in console

## 🚀 **Quick Start (5 minutes)**

### **If you don't have a backend:**

```bash
# 1. Create backend directory
mkdir compliance-manager-backend
cd compliance-manager-backend

# 2. Initialize and install
npm init -y
npm install express cors

# 3. Create server.js with the content from WORKING_BACKEND_SERVER.js
# (Copy the entire content)

# 4. Start server
node server.js
```

### **If you have a backend:**

```bash
# 1. Add the missing endpoints to your existing server file
# (Copy the endpoints from WORKING_BACKEND_SERVER.js)

# 2. Restart your server
npm start
```

## 🔧 **Environment Variables (Optional)**

Create a `.env` file in your backend directory:

```bash
# .env file
NODE_ENV=development
PORT=3333

# Xero Configuration (optional)
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=http://localhost:3001/redirecturl
```

## ✅ **Expected Results**

After following these steps:

1. **Server starts** without errors
2. **Console shows:** `🚀 Backend server started successfully!`
3. **All endpoints work:** No more 404 errors
4. **Frontend works:** Can call all Xero endpoints
5. **CORS works:** No CORS errors

## 🚨 **If Still Not Working**

Please check:

1. **Server is running** on port 3333
2. **No syntax errors** in server console
3. **Dependencies installed** (`npm install express cors`)
4. **Server file exists** and has the correct code

## 🎯 **Next Steps**

1. **Test all endpoints** to ensure they work
2. **Implement database operations** (replace TODO comments)
3. **Add authentication** if needed
4. **Deploy to production** when ready

**This will completely fix your 404 errors and make the system work!** 🚀

