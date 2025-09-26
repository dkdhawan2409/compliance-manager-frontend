# 🔍 Client ID Debug Guide

## 🚨 Current Issue

The OAuth URL is using client ID `8113118D16A84C8199677E98E3D8A446`, but Xero returns:
- **Error**: `unauthorized_client`
- **Message**: "Unknown client or client not enabled"
- **Error Code**: 500

## 🔧 Debugging Steps

### Step 1: Verify Client ID in Database

Check what client ID is actually stored in your database:

```sql
-- Check Xero settings for your company
SELECT 
  company_id,
  client_id,
  redirect_uri,
  created_at
FROM xero_settings 
WHERE company_id = YOUR_COMPANY_ID;
```

### Step 2: Check Xero Developer Portal

1. **Go to [Xero Developer Portal](https://developer.xero.com/)**
2. **Login to your Xero account**
3. **Go to "My Apps"**
4. **Find your app and check:**
   - **Client ID** - Should match `8113118D16A84C8199677E98E3D8A446`
   - **App Status** - Should be "Active" or "Live"
   - **Redirect URIs** - Should include `https://compliance-manager-frontend.onrender.com/redirecturl`

### Step 3: Verify Redirect URI Configuration

The OAuth URL shows redirect URI: `https://compliance-manager-frontend.onrender.com/redirecturl`

**Check in Xero Developer Portal:**
- This exact URL must be configured in your Xero app
- Case-sensitive and must match exactly
- No trailing slashes unless configured

### Step 4: Check App Configuration

In your Xero app settings, verify:
- ✅ **App is published/active**
- ✅ **Client ID matches** `8113118D16A84C8199677E98E3D8A446`
- ✅ **Redirect URI is configured** exactly as shown
- ✅ **Scopes are enabled** for the requested permissions

## 🛠️ Common Fixes

### Fix 1: Update Redirect URI in Xero

If the redirect URI doesn't match:

1. **Go to Xero Developer Portal**
2. **Edit your app**
3. **Add redirect URI**: `https://compliance-manager-frontend.onrender.com/redirecturl`
4. **Save changes**

### Fix 2: Use Correct Client ID

If the client ID is wrong:

1. **Get the correct client ID** from Xero Developer Portal
2. **Update your database**:
   ```sql
   UPDATE xero_settings 
   SET client_id = 'CORRECT_CLIENT_ID'
   WHERE company_id = YOUR_COMPANY_ID;
   ```

### Fix 3: Check App Status

If the app is not active:

1. **Go to Xero Developer Portal**
2. **Check app status**
3. **Publish/activate the app** if needed
4. **Wait a few minutes** for changes to propagate

## 🔍 Debug Commands

### Check Current Settings
```javascript
// In browser console on your app
fetch('/api/xero-plug-play/settings', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log);
```

### Test OAuth URL Generation
```javascript
// Test the OAuth URL generation
fetch('/api/xero-plug-play/connect?redirect_uri=https://compliance-manager-frontend.onrender.com/redirecturl', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log);
```

## 📋 Checklist

- [ ] **Client ID exists** in Xero Developer Portal
- [ ] **Client ID matches** what's in database
- [ ] **App is active/published** in Xero
- [ ] **Redirect URI is configured** exactly as used
- [ ] **Scopes are enabled** for requested permissions
- [ ] **No typos** in client ID or redirect URI

## 🚨 Most Likely Issues

### 1. **Wrong Client ID**
The client ID `8113118D16A84C8199677E98E3D8A446` might be:
- From a different Xero app
- From a deleted/disabled app
- A test/development client ID that's not active

### 2. **Redirect URI Mismatch**
The redirect URI `https://compliance-manager-frontend.onrender.com/redirecturl` might not be:
- Configured in your Xero app
- Exactly matching (case-sensitive)
- The correct endpoint for your app

### 3. **App Not Published**
Your Xero app might be:
- In development mode only
- Not published/activated
- Disabled or suspended

## 🎯 Next Steps

1. **Verify the client ID** in Xero Developer Portal
2. **Check the redirect URI** configuration
3. **Ensure the app is active/published**
4. **Update database** with correct client ID if needed
5. **Test the OAuth flow** again

The "unauthorized_client" error specifically means Xero doesn't recognize the client ID or the app configuration is incorrect. This is a configuration issue, not a code issue.
