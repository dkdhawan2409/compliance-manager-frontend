# Make Xero OAuth Work - Step by Step Guide

## 🚀 Quick Fix Steps

### Step 1: Check Your Current Setup
1. Open your app in the browser
2. Go to Xero Integration page
3. Click "Show Details" in the OAuth Troubleshooter
4. Copy the redirect URI shown

### Step 2: Update Xero App Configuration
1. Go to [Xero Developer Portal](https://developer.xero.com/myapps)
2. Find your app and click "Configuration"
3. In "Redirect URIs" section, add the exact URI you copied
4. Save the configuration

### Step 3: Set Environment Variables (for production)
If deploying to Render, set these environment variables:
```
VITE_FRONTEND_URL=https://compliance-manager-frontend.onrender.com
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
```

### Step 4: Test the OAuth Flow
1. Clear browser cache and localStorage
2. Try connecting to Xero
3. Check browser console for any errors
4. Use the OAuth Troubleshooter if issues persist

## 🔧 What I've Fixed

### 1. **Robust OAuth Flow Management**
- Added `XeroOAuthHelper` class to manage OAuth state
- Proper state verification and timeout handling
- Automatic cleanup of expired OAuth flows

### 2. **Better Error Handling**
- Comprehensive error messages
- Automatic OAuth flow reset on errors
- Detailed logging for debugging

### 3. **OAuth Troubleshooter Component**
- Shows current redirect URI
- Provides copy button for easy configuration
- Lists common issues and solutions
- Direct link to Xero app settings

### 4. **Improved Domain Detection**
- Uses actual window location for dynamic ports
- Proper fallbacks for production environments
- Better environment variable handling

## 🎯 Expected Redirect URIs

### Development:
```
http://localhost:3000/redirecturl
http://localhost:3001/redirecturl
http://localhost:3002/redirecturl
```

### Production (Render):
```
https://compliance-manager-frontend.onrender.com/redirecturl
```

## 🚨 Common Issues & Solutions

### Issue: "Invalid redirect_uri"
**Solution:** Copy the exact redirect URI from the troubleshooter and add it to your Xero app

### Issue: "unauthorized_client"
**Solution:** Check your Client ID and Client Secret in Xero Settings

### Issue: OAuth flow expires
**Solution:** Click "Reset OAuth Flow" in the troubleshooter and try again

### Issue: Still getting localhost in production
**Solution:** Set `VITE_FRONTEND_URL` environment variable in Render

## ✅ Success Indicators

You'll know it's working when:
1. OAuth flow starts without errors
2. You're redirected to Xero login page
3. After authorization, you're redirected back to your app
4. Connection status shows "Connected"
5. You can see Xero data in the dashboard

## 🆘 Still Having Issues?

1. Check browser console for detailed error logs
2. Use the OAuth Troubleshooter component
3. Verify all environment variables are set correctly
4. Make sure Xero app redirect URIs match exactly
5. Try resetting the OAuth flow and starting fresh

The OAuth flow should now work reliably with proper error handling and debugging tools!
