# Xero OAuth 2.0 Troubleshooting Guide

## 🚨 **Why Xero OAuth 2.0 is Not Working**

Based on the analysis of your codebase, here are the most likely reasons why Xero OAuth 2.0 authentication is failing:

### 1. **Missing Backend OAuth Endpoints** ⚠️
**Problem:** Your backend may not have implemented the required OAuth endpoints.

**Required Backend Endpoints:**
```
GET /api/xero/login - Initiates OAuth flow
GET /api/xero/callback - Handles OAuth callback
POST /api/xero/refresh-token - Refreshes access tokens
GET /api/xero/settings - Manages OAuth settings
```

**Check if endpoints exist:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3333/api/xero/login
```

### 2. **Environment Configuration Issues** 🔧
**Problem:** Frontend is not properly configured to connect to local backend.

**Solution:** 
- ✅ Created `.env.local` with `VITE_API_URL=http://localhost:3333/api`
- ✅ Updated `envChecker.ts` to use local backend as default
- ✅ Enhanced API client with better error logging

### 3. **Xero App Configuration** 📱
**Problem:** Xero app in developer portal may not be configured correctly.

**Required Xero App Settings:**
```
App Type: Web app
Redirect URI: http://localhost:3333/api/xero/callback
Scopes: offline_access, accounting.transactions, accounting.contacts, accounting.settings
```

### 4. **OAuth Flow Implementation Gaps** 🔄
**Problem:** The OAuth flow may have missing steps or incorrect implementation.

## 🛠️ **Step-by-Step Fix Process**

### Step 1: Verify Backend OAuth Implementation

1. **Check if OAuth endpoints exist:**
```bash
# Test OAuth initiation
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/xero/login

# Expected response:
# {
#   "success": true,
#   "data": {
#     "authUrl": "https://login.xero.com/identity/connect/authorize?...",
#     "state": "random-state-string"
#   }
# }
```

2. **If endpoints don't exist, implement them in your backend:**
```javascript
// GET /api/xero/login
app.get('/api/xero/login', authenticateToken, async (req, res) => {
  try {
    const state = generateRandomState();
    const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${XERO_CLIENT_ID}&redirect_uri=${XERO_REDIRECT_URI}&scope=offline_access accounting.transactions accounting.contacts accounting.settings&state=${state}`;
    
    res.json({
      success: true,
      data: { authUrl, state }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/xero/callback
app.get('/api/xero/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    
    // Get Xero tenants
    const tenants = await getXeroTenants(tokenResponse.access_token);
    
    // Store connection in database
    await storeConnections(req.user.companyId, tokenResponse, tenants);
    
    res.json({ success: true, data: { tenants } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Step 2: Configure Xero App

1. **Go to [Xero Developer Portal](https://developer.xero.com/)**
2. **Create or edit your app:**
   - App Type: Web app
   - Redirect URI: `http://localhost:3333/api/xero/callback`
   - Scopes: `offline_access`, `accounting.transactions`, `accounting.contacts`, `accounting.settings`

3. **Copy your credentials:**
   - Client ID
   - Client Secret

### Step 3: Test the OAuth Flow

1. **Start your frontend:**
```bash
cd frontend
npm run dev
```

2. **Navigate to Xero Integration page:**
   - Go to `/integrations/xero`
   - Click "Show Debug" to see debug information
   - Click "Test Connection" to verify backend connectivity

3. **Configure Xero Settings:**
   - Enter your Client ID and Client Secret
   - Set Redirect URI to: `http://localhost:3333/api/xero/callback`
   - Save settings

4. **Test OAuth Flow:**
   - Click "Connect to Xero"
   - Should redirect to Xero login
   - Complete authorization
   - Should redirect back to your app

### Step 4: Debug Common Issues

#### Issue: "404 Not Found" on OAuth endpoints
**Cause:** Backend OAuth endpoints not implemented
**Solution:** Implement the required endpoints in your backend

#### Issue: "Invalid redirect URI"
**Cause:** Redirect URI mismatch between Xero app and your configuration
**Solution:** Ensure both Xero app and your settings use: `http://localhost:3333/api/xero/callback`

#### Issue: "Client ID not found"
**Cause:** Xero app not properly configured or credentials incorrect
**Solution:** Verify Client ID and Secret in Xero Developer Portal

#### Issue: "State parameter mismatch"
**Cause:** OAuth state validation failing
**Solution:** Ensure state is properly generated and validated in backend

## 🔍 **Enhanced Debugging**

The updated code now includes:

1. **Enhanced API Client Logging:**
   - Logs all OAuth-related requests and responses
   - Provides specific error messages for common issues
   - Shows detailed error information in console

2. **Debug Panel in XeroSettings:**
   - Shows environment configuration
   - Displays connection status
   - Tests backend connectivity
   - Validates OAuth endpoints

3. **Better Error Handling:**
   - Specific error messages for different failure types
   - Validation of OAuth URLs
   - Checks for required settings before starting OAuth

## 📋 **Checklist for Success**

- [ ] Backend is running on `http://localhost:3333`
- [ ] OAuth endpoints are implemented in backend
- [ ] Xero app is configured with correct redirect URI
- [ ] Frontend environment is set to local backend
- [ ] Xero settings are configured with valid credentials
- [ ] OAuth flow completes without errors
- [ ] Tokens are properly stored and managed

## 🚀 **Quick Test Commands**

```bash
# Test backend health
curl http://localhost:3333/api/health

# Test OAuth endpoint (requires valid token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/xero/login

# Test Xero app configuration
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/xero/settings
```

## 📞 **Next Steps**

1. **Check your backend implementation** for the required OAuth endpoints
2. **Configure your Xero app** in the developer portal
3. **Test the OAuth flow** using the debug panel
4. **Review console logs** for detailed error information
5. **Verify token storage** and management

If you're still experiencing issues after following this guide, please check:
- Backend logs for server-side errors
- Browser console for client-side errors
- Network tab for failed requests
- Xero app configuration in developer portal 