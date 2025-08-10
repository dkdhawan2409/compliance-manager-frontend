# Xero OAuth Error Analysis: "Invalid authorization code or redirect URI"

## 🚨 **Error Source Identification**

The error **"Invalid authorization code or redirect URI"** is coming from the **backend** during the OAuth token exchange process. Here's the exact flow:

### **Error Flow:**
```
1. Frontend → Backend: POST /api/xero/callback
   Body: { code: "authorization_code", state: "state_value" }

2. Backend → Xero API: POST https://identity.xero.com/connect/token
   Body: {
     grant_type: "authorization_code",
     code: "authorization_code", 
     redirect_uri: "http://localhost:3333/api/xero/callback",
     client_id: "your_client_id",
     client_secret: "your_client_secret"
   }

3. Xero API → Backend: ERROR RESPONSE
   {
     "error": "invalid_grant",
     "error_description": "Invalid authorization code or redirect URI"
   }

4. Backend → Frontend: ERROR RESPONSE
   {
     "success": false,
     "message": "Invalid authorization code or redirect URI"
   }
```

## 🔍 **Root Cause Analysis**

### **Most Likely Causes:**

#### 1. **Redirect URI Mismatch** ⚠️
**Problem:** The redirect URI used in the token exchange doesn't match what's configured in your Xero app.

**Check:**
- Xero App Settings: `http://localhost:3333/api/xero/callback`
- Backend Configuration: Should match exactly
- Frontend Settings: Should match exactly

#### 2. **Authorization Code Already Used** ⚠️
**Problem:** OAuth authorization codes can only be used once. If the code was already exchanged for tokens, it becomes invalid.

**Causes:**
- User clicked "Connect" multiple times
- Backend tried to exchange the same code twice
- Network issues caused retries

#### 3. **Authorization Code Expired** ⚠️
**Problem:** OAuth authorization codes expire quickly (usually 10 minutes).

**Causes:**
- User took too long to complete the flow
- Network delays
- Backend processing delays

#### 4. **Client ID/Secret Mismatch** ⚠️
**Problem:** The client credentials used in the token exchange don't match your Xero app.

**Check:**
- Client ID in backend matches Xero app
- Client Secret in backend matches Xero app
- App is properly configured in Xero Developer Portal

#### 5. **Backend OAuth Implementation Issues** ⚠️
**Problem:** The backend OAuth implementation has bugs or missing components.

**Common Issues:**
- Missing state validation
- Incorrect token exchange request format
- Wrong OAuth endpoints
- Missing error handling

## 🛠️ **Debugging Steps**

### **Step 1: Use the Debug Panel**
1. Go to `/integrations/xero`
2. Click "Show Debug Panel"
3. Click "Run Debug Test"
4. Review the results, especially:
   - OAuth Login Endpoint test
   - OAuth Callback Endpoint test
   - Environment configuration

### **Step 2: Check Backend Logs**
Look for these specific error patterns in your backend logs:

```bash
# Check backend logs for OAuth errors
tail -f /path/to/backend/logs | grep -i "oauth\|xero\|authorization"
```

**Look for:**
- `invalid_grant` errors
- `redirect_uri_mismatch` errors
- `invalid_client` errors
- Token exchange request details

### **Step 3: Verify Xero App Configuration**
1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Check your app settings:
   - **Redirect URI:** Must be exactly `http://localhost:3333/api/xero/callback`
   - **Client ID:** Must match what's in your backend
   - **Client Secret:** Must match what's in your backend
   - **App Status:** Must be active/approved

### **Step 4: Test OAuth Flow Manually**
```bash
# Test OAuth initiation
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/xero/login

# Expected response:
{
  "success": true,
  "data": {
    "authUrl": "https://login.xero.com/identity/connect/authorize?...",
    "state": "random_state"
  }
}
```

## 🔧 **Fix Implementation**

### **Fix 1: Backend OAuth Implementation**

Your backend needs to implement the OAuth callback correctly:

```javascript
// GET /api/xero/callback
app.get('/api/xero/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // 1. Validate state parameter
    if (!validateState(state)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state parameter'
      });
    }

    // 2. Exchange code for tokens
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:3333/api/xero/callback', // MUST MATCH XERO APP
        client_id: process.env.XERO_CLIENT_ID,
        client_secret: process.env.XERO_CLIENT_SECRET,
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Xero token exchange failed:', errorData);
      
      return res.status(400).json({
        success: false,
        message: errorData.error_description || 'Token exchange failed'
      });
    }

    const tokens = await tokenResponse.json();
    
    // 3. Get Xero tenants
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': 'YOUR_TENANT_ID'
      }
    });
    
    const tenants = await tenantsResponse.json();
    
    // 4. Store tokens securely
    await storeTokens(req.user.companyId, tokens, tenants);
    
    // 5. Redirect to success page
    res.redirect('/xero-callback?success=true&companyId=' + req.user.companyId);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/xero-callback?error=OAuth failed&errorDetails=' + encodeURIComponent(error.message));
  }
});
```

### **Fix 2: Environment Configuration**

Ensure your backend has the correct environment variables:

```bash
# Backend .env file
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3333/api/xero/callback
```

### **Fix 3: Frontend Configuration**

Ensure your frontend settings match:

```javascript
// In XeroSettings component
const defaultRedirectUri = 'http://localhost:3333/api/xero/callback';
```

## 📋 **Verification Checklist**

- [ ] Backend OAuth endpoints are implemented
- [ ] Xero app redirect URI matches exactly: `http://localhost:3333/api/xero/callback`
- [ ] Client ID and Secret are correctly configured
- [ ] State parameter is properly validated
- [ ] Token exchange request format is correct
- [ ] Error handling is implemented
- [ ] Backend logs show successful token exchange
- [ ] Frontend receives successful callback

## 🚀 **Quick Test**

1. **Clear any existing OAuth state:**
   ```bash
   # Clear browser storage
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Test the complete flow:**
   - Configure Xero settings
   - Click "Connect to Xero"
   - Complete OAuth authorization
   - Check for successful callback

3. **Monitor the debug panel** for detailed error information

## 📞 **Next Steps**

1. **Run the debug panel** to identify specific issues
2. **Check your backend implementation** against the provided code
3. **Verify Xero app configuration** in the developer portal
4. **Review backend logs** for detailed error messages
5. **Test the OAuth flow** step by step

The debug panel will help you identify exactly where the OAuth flow is failing and provide specific guidance on how to fix it. 