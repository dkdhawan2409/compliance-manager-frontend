# Xero OAuth Setup Guide

## 🔧 **Backend Configuration**

### 1. **Environment Variables for Backend**

Create a `.env` file in your backend directory with the following variables:

```bash
# Xero OAuth Configuration
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=http://localhost:3333/api/xero/callback
XERO_WEBHOOK_SIGNING_KEY=your-webhook-signing-key-here

# Database and JWT
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your-jwt-secret

# Encryption (for storing OAuth tokens securely)
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 2. **Backend OAuth Endpoints**

Your backend needs to implement these endpoints:

```javascript
// GET /api/xero/login
// Initiates OAuth flow
app.get('/api/xero/login', authenticateToken, async (req, res) => {
  const state = generateRandomState();
  const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${XERO_CLIENT_ID}&redirect_uri=${XERO_REDIRECT_URI}&scope=offline_access accounting.transactions accounting.contacts accounting.settings&state=${state}`;
  
  res.json({
    success: true,
    data: {
      authUrl,
      state
    }
  });
});

// GET /api/xero/callback
// Handles OAuth callback
app.get('/api/xero/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    
    // Get Xero tenants
    const tenants = await getXeroTenants(tokenResponse.access_token);
    
    // Store connection in database
    const connections = await storeConnections(req.user.companyId, tokenResponse, tenants);
    
    res.json({
      success: true,
      data: {
        connections
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

## 🔗 **Frontend Configuration**

### 1. **Environment Variables for Frontend**

Create a `.env` file in your frontend directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:3333/api

# Xero Webhook (optional)
VITE_XERO_WEBHOOK_SIGNING_KEY=your-webhook-signing-key-here
```

### 2. **OAuth Flow Implementation**

The frontend handles the OAuth flow like this:

```typescript
// 1. User clicks "Connect Xero"
const handleConnect = async () => {
  try {
    const response = await xeroService.initiateLogin();
    // Redirect to Xero OAuth
    window.location.href = response.authUrl;
  } catch (error) {
    console.error('Failed to initiate OAuth:', error);
  }
};

// 2. Handle OAuth callback
useEffect(() => {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (code && state) {
    handleCallbackMutation.mutate({ code, state });
  }
}, [searchParams]);
```

## 🎯 **Xero App Configuration**

### 1. **Create Xero App**

1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Create a new app
3. Configure OAuth settings

### 2. **OAuth Settings**

In your Xero app settings:

```
App Name: Compliance Manager
App Type: Web app
Redirect URI: http://localhost:3333/api/xero/callback
Scopes: offline_access, accounting.transactions, accounting.contacts, accounting.settings
```

### 3. **Webhook Configuration**

For webhook support:

```
Webhook URL: http://localhost:3333/api/xero/webhook
Events: Invoice, Contact, Account
Signing Key: (generate and save this)
```

## 🔄 **OAuth Flow Diagram**

```
1. User clicks "Connect Xero"
   ↓
2. Frontend calls http://localhost:3333/api/xero/login
   ↓
3. Backend generates state and auth URL
   ↓
4. Frontend redirects to Xero OAuth
   ↓
5. User authorizes app on Xero
   ↓
6. Xero redirects to http://localhost:3333/api/xero/callback with code
   ↓
7. Backend exchanges code for tokens
   ↓
8. Backend stores tokens and returns connections
   ↓
9. Frontend updates UI with connections
```

## 🛠️ **Testing the OAuth Flow**

### 1. **Test Backend Health**

```bash
curl http://localhost:3333/api/health
```

### 2. **Test OAuth Initiation**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/xero/login
```

### 3. **Test with Frontend**

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   # Backend should be running on http://localhost:3333
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   # Frontend should be running on http://localhost:3004 (or available port)
   ```

3. **Test OAuth:**
   - Navigate to Xero integration page
   - Click "Connect Xero"
   - Complete OAuth flow
   - Check for successful callback

## 🔍 **Debugging OAuth Issues**

### Common Issues:

1. **"Invalid redirect URI"**
   - Check that redirect URI in Xero app matches exactly: `http://localhost:3333/api/xero/callback`
   - Ensure no trailing slashes or extra characters

2. **"Client ID not found"**
   - Verify XERO_CLIENT_ID is set correctly
   - Check that the app is published/approved

3. **"State parameter mismatch"**
   - Ensure state is being generated and validated properly
   - Check for CSRF protection issues

4. **"Code exchange failed"**
   - Verify XERO_CLIENT_SECRET is correct
   - Check that redirect URI matches exactly

### Debug Commands:

```bash
# Test OAuth initiation
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/xero/login

# Test callback endpoint
curl "http://localhost:3333/api/xero/callback?code=test&state=test"

# Check environment variables
echo $XERO_CLIENT_ID
echo $XERO_REDIRECT_URI
```

## 📋 **URL Configuration Summary**

### Backend URLs:
- **OAuth Initiation**: `GET http://localhost:3333/api/xero/login`
- **OAuth Callback**: `GET http://localhost:3333/api/xero/callback`
- **Connections**: `GET http://localhost:3333/api/xero/connections`
- **Data Endpoints**: `GET http://localhost:3333/api/xero/:connectionId/invoices`

### Frontend URLs:
- **Integration Page**: `/integrations/xero`
- **Data Pages**: `/xero/:connectionId/invoices`

### Xero App URLs:
- **Redirect URI**: `http://localhost:3333/api/xero/callback`
- **Webhook URL**: `http://localhost:3333/api/xero/webhook`

## ✅ **Checklist**

- [ ] Xero app created and configured
- [ ] OAuth redirect URI set correctly: `http://localhost:3333/api/xero/callback`
- [ ] Backend environment variables configured
- [ ] Frontend environment variables configured
- [ ] OAuth endpoints implemented on backend
- [ ] Token storage and encryption configured
- [ ] Webhook endpoints implemented (optional)
- [ ] Error handling implemented
- [ ] Testing completed

## 🚀 **Next Steps**

1. **Implement Backend OAuth Endpoints** according to the specification
2. **Set up Token Storage** with encryption
3. **Configure Webhook Processing** for real-time updates
4. **Add Error Handling** for OAuth failures
5. **Test Complete Flow** end-to-end
6. **Deploy to Production** with proper environment variables 