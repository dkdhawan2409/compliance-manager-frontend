# Debug: Still Getting localhost:3001 Redirect

## 🚨 Issue: Xero still redirects to localhost:3001

Even after all the fixes, Xero is still redirecting to `localhost:3001`. Let me help you debug this.

## 🔍 Possible Causes

### 1. **Xero App Configuration (MOST LIKELY)**
Your Xero app might still have `localhost:3001` configured as a redirect URI.

### 2. **Backend Override**
The backend might be overriding the redirect URI we send.

### 3. **Cached OAuth State**
There might be cached OAuth state causing issues.

## 🚀 Debug Steps

### Step 1: Check Xero App Configuration
1. Go to [Xero Developer Portal](https://developer.xero.com/myapps)
2. Find your app
3. Go to "Configuration"
4. Check "Redirect URIs" section
5. **REMOVE ALL localhost URIs**:
   - ❌ `http://localhost:3000/redirecturl`
   - ❌ `http://localhost:3001/redirecturl`
   - ❌ `http://localhost:3002/redirecturl`
6. **ADD ONLY Render URI**:
   - ✅ `https://compliance-manager-frontend.onrender.com/redirecturl`
7. Save the configuration

### Step 2: Test Redirect URI Generation
1. Go to your Xero Integration page on Render
2. Open browser console
3. Click "Show Details" in OAuth Troubleshooter
4. Click "🚀 Force Render URI (NO LOCALHOST)" button
5. Check console for logs:
   ```
   🔧 Render redirect URI: https://compliance-manager-frontend.onrender.com/redirecturl
   ```

### Step 3: Test OAuth Flow
1. Click "🧪 Test OAuth Flow" button
2. Check console for:
   ```
   🔧 Generating OAuth URL with RENDER redirect URI: https://compliance-manager-frontend.onrender.com/redirecturl
   🔧 NO LOCALHOST - Using Render domain only
   ```

### Step 4: Check Backend Response
Look for this in console:
```
🔧 Backend response: { data: { authUrl: "https://login.xero.com/identity/connect/authorize?..." } }
```

The authUrl should contain `redirect_uri=https%3A%2F%2Fcompliance-manager-frontend.onrender.com%2Fredirecturl`

## 🔧 Quick Fix Commands

### Clear All OAuth State
```javascript
// Run this in browser console
localStorage.removeItem('xero_oauth_state');
localStorage.removeItem('xero_oauth_start_time');
localStorage.removeItem('xero_oauth_redirect_uri');
localStorage.removeItem('xero_tokens');
localStorage.removeItem('xero_authorized');
localStorage.removeItem('xero_auth_timestamp');
```

### Force Render Redirect URI
```javascript
// Run this in browser console
const renderUri = 'https://compliance-manager-frontend.onrender.com/redirecturl';
console.log('Forcing redirect URI:', renderUri);
```

## 🎯 Most Likely Solution

**The issue is probably in your Xero app configuration.** Make sure:

1. **Remove ALL localhost URIs** from Xero app
2. **Add ONLY the Render URI**: `https://compliance-manager-frontend.onrender.com/redirecturl`
3. **Save the configuration**
4. **Wait 1-2 minutes** for changes to propagate
5. **Try the OAuth flow again**

## 🚨 If Still Not Working

1. **Check browser console** for all the debug logs
2. **Verify Xero app configuration** has no localhost URIs
3. **Clear browser cache** and localStorage
4. **Try in incognito mode**
5. **Check if backend is overriding** the redirect URI

The most common cause is that Xero app still has localhost configured as a redirect URI!
