# 🚨 Xero "Failed to fetch" Error - Complete Fix

## 🔍 **Error Analysis**

You're seeing this error:
```
❌ Error fetching Xero settings: TypeError: Failed to fetch
```

This indicates **two separate issues** that both need to be fixed:

## 🛠️ **Issue #1: Frontend API Connection**

The "Failed to fetch" error suggests a network/CORS issue. Let's fix this first.

### **Fix 1A: Verify Environment Variables**
Make sure your frontend has the correct API URL. In your **Render Frontend Service**:

1. Go to your frontend service in Render Dashboard
2. Navigate to **Environment** tab
3. Ensure this variable is set:

```bash
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
```

### **Fix 1B: Redeploy Frontend**
After setting the environment variable:
1. Your frontend will automatically redeploy
2. Wait for deployment to complete (~2-3 minutes)

## 🛠️ **Issue #2: Backend Xero Credentials Missing**

Even after fixing the network issue, you'll still see "No Credentials Configured" until you set up Xero OAuth2 credentials.

### **Fix 2A: Get Xero Credentials**
1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Sign in with your Xero account
3. Create a new app or select existing one
4. Go to **Configuration** tab
5. Copy:
   - **Client ID** (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - **Client Secret** (e.g., `ABC123def456ghi789...`)

### **Fix 2B: Set Backend Environment Variables**
In your **Render Backend Service Dashboard**:

1. Go to your backend service settings
2. Navigate to **Environment** tab  
3. Add these **3 variables**:

```bash
XERO_CLIENT_ID=your-actual-client-id-from-xero
XERO_CLIENT_SECRET=your-actual-client-secret-from-xero
XERO_REDIRECT_URI=https://compliance-manager-frontend.onrender.com/redirecturl
```

### **Fix 2C: Configure Xero App Redirect URI**
In your Xero app configuration, add this redirect URI:
```
https://compliance-manager-frontend.onrender.com/redirecturl
```

## 🔄 **Complete Fix Checklist**

### **Frontend Service (Render Dashboard)**
- [ ] Set `VITE_API_URL=https://compliance-manager-backend.onrender.com/api`
- [ ] Wait for automatic redeploy

### **Backend Service (Render Dashboard)**  
- [ ] Set `XERO_CLIENT_ID=your-client-id`
- [ ] Set `XERO_CLIENT_SECRET=your-client-secret`
- [ ] Set `XERO_REDIRECT_URI=https://compliance-manager-frontend.onrender.com/redirecturl`
- [ ] Wait for automatic redeploy

### **Xero Developer Portal**
- [ ] Add redirect URI: `https://compliance-manager-frontend.onrender.com/redirecturl`

## ✅ **Testing the Fix**

### **Step 1: Test API Connection**
After frontend redeploy, check browser console for:
```
✅ API Client initialized with URL: https://compliance-manager-backend.onrender.com/api
```

### **Step 2: Test Xero Integration**
1. Go to: https://compliance-manager-frontend.onrender.com/xero-oauth2
2. Button should show "🔗 Connect to Xero" (not "No Credentials Configured")
3. Click button → should redirect to Xero authorization page

## 🚨 **Common Issues**

### **Still getting "Failed to fetch"?**
- Check that `VITE_API_URL` is set in **frontend** service (not backend)
- Verify URL is exactly: `https://compliance-manager-backend.onrender.com/api`
- Clear browser cache and try again

### **Still showing "No Credentials Configured"?**
- Check that Xero variables are set in **backend** service (not frontend)
- Verify Client ID and Secret are copied correctly
- Check backend logs for error messages

### **"Invalid Client" error?**
- Double-check Client ID and Secret from Xero Developer Portal
- Make sure redirect URI matches exactly in Xero app

## ⏱️ **Timeline**
- **Frontend fix**: ~5 minutes (set env var + redeploy)
- **Backend fix**: ~10 minutes (get Xero credentials + set env vars + redeploy)  
- **Xero app config**: ~2 minutes
- **Total**: ~15-20 minutes

## 🎯 **Expected Final Result**

After completing all fixes:
1. ✅ No more "Failed to fetch" errors
2. ✅ Button shows "Connect to Xero" 
3. ✅ OAuth flow works properly
4. ✅ Can connect to Xero and load data

---

## 🔧 **Quick Summary**

**Two separate fixes needed:**
1. **Frontend**: Set `VITE_API_URL` environment variable
2. **Backend**: Set 3 Xero OAuth2 environment variables

Both services will auto-redeploy after setting environment variables. The fixes address both the network connection issue and the missing Xero credentials!
