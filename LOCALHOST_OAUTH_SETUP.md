# 🔧 Localhost OAuth Setup Guide

## 🎯 **Issue Fixed: All URLs Now Point to Localhost**

I've updated all the URLs to work with localhost development. Here's what was changed:

## ✅ **URLs Updated for Localhost:**

### **1. Frontend Settings (XeroSettings.tsx)**
```typescript
// ✅ UPDATED: Redirect URI for localhost
redirectUri: 'http://localhost:3002/redirecturl'
```

### **2. Frontend Redirect (XeroRedirect.tsx)**
```typescript
// ✅ UPDATED: Backend API URL for localhost
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
```

### **3. Backend Redirects (xeroController.js)**
```javascript
// ✅ UPDATED: All redirect URLs for localhost
const redirectUrl = new URL('http://localhost:3002/xero-callback');
```

## 🚀 **Complete Localhost OAuth Flow:**

```
1. ✅ User clicks "Connect Xero"
   ↓
2. ✅ Frontend calls: http://localhost:3333/api/xero/login
   ↓
3. ✅ Backend generates auth URL with redirect: http://localhost:3002/redirecturl
   ↓
4. ✅ User authorizes on Xero
   ↓
5. ✅ Xero redirects to: http://localhost:3002/redirecturl?code=...&state=...
   ↓
6. ✅ XeroRedirect.tsx redirects to: http://localhost:3333/api/xero/callback?code=...&state=...
   ↓
7. ✅ Backend processes OAuth and redirects to: http://localhost:3002/xero-callback?success=true&...
   ↓
8. ✅ XeroCallback.tsx shows success page
```

## 🔧 **Xero App Configuration for Localhost:**

### **Required Xero App Settings:**
1. **Go to [Xero Developer Portal](https://developer.xero.com/)**
2. **Update your app settings:**
   - **Redirect URI:** `http://localhost:3002/redirecturl`
   - **Client ID:** Your Xero Client ID
   - **Client Secret:** Your Xero Client Secret

### **Important:** The redirect URI in your Xero app **MUST** match exactly:
```
http://localhost:3002/redirecturl
```

## 🛠️ **Testing Steps:**

### **1. Verify Backend is Running:**
```bash
# Check if backend is running on localhost:3333
curl http://localhost:3333/api/health
```

### **2. Verify Frontend is Running:**
```bash
# Check if frontend is running on localhost:3002
curl http://localhost:3002
```

### **3. Test OAuth Flow:**
1. **Login to your application** (get a valid JWT token)
2. **Go to Xero Integration page:** `http://localhost:3002/integrations/xero`
3. **Configure Xero settings:**
   - **Client ID:** Your Xero Client ID
   - **Client Secret:** Your Xero Client Secret
   - **Redirect URI:** `http://localhost:3002/redirecturl` (should be pre-filled)
4. **Click "Connect to Xero"**
5. **Complete OAuth authorization on Xero**
6. **Verify redirect to success page:** `http://localhost:3002/xero-callback`

## 🔍 **Debug Information:**

### **Check Environment Variables:**
```bash
# Frontend .env.local should contain:
VITE_API_URL=http://localhost:3333/api
```

### **Check Network Tab:**
1. **OAuth initiation:** `GET http://localhost:3333/api/xero/login`
2. **OAuth callback:** `GET http://localhost:3333/api/xero/callback?code=...&state=...`
3. **Final redirect:** `http://localhost:3002/xero-callback?success=true&...`

### **Check Console Logs:**
- ✅ "Redirecting to backend callback: http://localhost:3333/api/xero/callback..."
- ✅ "Processing callback with params: ..."
- ✅ "Xero connected successfully!" toast message

## 🚨 **Common Issues & Solutions:**

### **Issue 1: "Invalid redirect URI"**
**Cause:** Xero app redirect URI doesn't match
**Solution:** Update Xero app redirect URI to `http://localhost:3002/redirecturl`

### **Issue 2: "Backend not responding"**
**Cause:** Backend not running on localhost:3333
**Solution:** Start backend server

### **Issue 3: "Frontend not responding"**
**Cause:** Frontend not running on localhost:3002
**Solution:** Start frontend server

### **Issue 4: "Invalid authorization code"**
**Cause:** Authorization code already used or expired
**Solution:** Try the OAuth flow again (codes are single-use)

## 📋 **Checklist for Success:**

- [ ] Backend running on `http://localhost:3333`
- [ ] Frontend running on `http://localhost:3002`
- [ ] Xero app redirect URI set to `http://localhost:3002/redirecturl`
- [ ] Valid Xero Client ID and Secret configured
- [ ] User logged in with valid JWT token
- [ ] OAuth flow completes without errors
- [ ] Success page displays with company ID and tenants

## 🎉 **Expected Result:**

After completing the OAuth flow, you should see:
- ✅ **Success page** at `http://localhost:3002/xero-callback`
- ✅ **Company ID** displayed
- ✅ **Connected Xero Organizations** listed
- ✅ **"Xero connected successfully!"** toast message
- ✅ **"Go to Dashboard"** and **"Xero Settings"** buttons

## 🔧 **If Still Having Issues:**

1. **Check Xero app configuration** in developer portal
2. **Verify all URLs are exactly as specified**
3. **Check browser console** for error messages
4. **Check backend logs** for OAuth errors
5. **Use the debug panel** in Xero Settings to test connectivity

**All URLs are now configured for localhost development. The OAuth flow should work correctly!**
