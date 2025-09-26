# 🔧 Super Admin Client ID Fix Guide

## 🚨 Problem

The OAuth URL is using client ID `8113118D16A84C8199677E98E3D8A446`, but Xero returns "unauthorized_client" error. This means the client ID stored in your database is incorrect or the Xero app is not properly configured.

## 🎯 Solution

The plug-and-play Xero integration should use the client ID that was saved by the super admin. Here's how to fix it:

## 📋 Step-by-Step Fix

### Step 1: Check Current Client ID in Database

Run the debug script to see what client ID is currently stored:

```bash
cd backend
node fix-xero-client-id.js check
```

This will show you:
- All companies with Xero settings
- Current client IDs being used
- Whether all companies use the same client ID

### Step 2: Get Correct Client ID from Xero Developer Portal

1. **Go to [Xero Developer Portal](https://developer.xero.com/)**
2. **Login to your Xero account**
3. **Go to "My Apps"**
4. **Find your app and copy the correct Client ID**
5. **Verify the app is active/published**

### Step 3: Update Client ID in Database

Use the correct client ID from Step 2:

```bash
# Update client ID for all companies
node fix-xero-client-id.js update "YOUR_CORRECT_CLIENT_ID"

# Or update with redirect URI
node fix-xero-client-id.js update "YOUR_CORRECT_CLIENT_ID" "https://compliance-manager-frontend.onrender.com/redirecturl"
```

### Step 4: Verify Xero App Configuration

In your Xero Developer Portal, ensure:

- ✅ **Client ID matches** what you just updated in database
- ✅ **App is published/active**
- ✅ **Redirect URI is configured**: `https://compliance-manager-frontend.onrender.com/redirecturl`
- ✅ **Scopes are enabled**:
  - `offline_access`
  - `openid`
  - `profile`
  - `email`
  - `accounting.transactions`
  - `accounting.settings`
  - `accounting.reports.read`
  - `accounting.contacts`

### Step 5: Test the Fix

1. **Restart your backend server**
2. **Navigate to** `/xero-integration`
3. **Click "Connect to Xero"**
4. **Verify the OAuth URL** now uses the correct client ID
5. **Complete the OAuth flow**

## 🔍 Debug Commands

### Check Database Settings
```bash
cd backend
node fix-xero-client-id.js check
```

### Update Client ID
```bash
# Replace with your actual client ID from Xero Developer Portal
node fix-xero-client-id.js update "YOUR_ACTUAL_CLIENT_ID"
```

### Add Settings for Specific Company
```bash
node fix-xero-client-id.js add 1 "YOUR_CLIENT_ID" "YOUR_CLIENT_SECRET" "https://compliance-manager-frontend.onrender.com/redirecturl"
```

## 🚨 Common Issues & Solutions

### Issue 1: "Unknown client or client not enabled"
**Solution**: 
- Verify client ID in Xero Developer Portal
- Ensure app is published/active
- Check that client ID matches exactly

### Issue 2: "Invalid redirect URI"
**Solution**:
- Add exact redirect URI to Xero app: `https://compliance-manager-frontend.onrender.com/redirecturl`
- Ensure no trailing slashes or typos

### Issue 3: Wrong client ID in database
**Solution**:
- Use the fix script to update with correct client ID
- Verify all companies use the same client ID

### Issue 4: App not published
**Solution**:
- Go to Xero Developer Portal
- Publish/activate your app
- Wait a few minutes for changes to propagate

## 📊 Expected Results

After fixing:

### ✅ Success Indicators:
- OAuth URL uses correct client ID from Xero Developer Portal
- No "unauthorized_client" error
- Redirect to Xero login page works
- OAuth flow completes successfully

### ❌ Still Failing:
- Check Xero Developer Portal configuration
- Verify app is published and active
- Ensure redirect URI matches exactly
- Check that all required scopes are enabled

## 🔧 Super Admin Configuration

If you're the super admin and need to configure Xero for all companies:

### Option 1: Use Existing Super Admin Endpoint
```bash
# Use the existing super admin endpoint
curl -X POST http://localhost:3333/api/companies/admin/xero-client-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "clientId": "YOUR_CORRECT_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUri": "https://compliance-manager-frontend.onrender.com/redirecturl"
  }'
```

### Option 2: Use Fix Script
```bash
# Update all companies with correct client ID
node fix-xero-client-id.js update "YOUR_CORRECT_CLIENT_ID" "https://compliance-manager-frontend.onrender.com/redirecturl"
```

## 🎯 Key Points

1. **The plug-and-play integration correctly uses the client ID from the database**
2. **The issue is that the wrong client ID is stored in the database**
3. **Super admin needs to update the client ID for all companies**
4. **Xero app must be properly configured in Developer Portal**
5. **Redirect URI must match exactly (case-sensitive)**

## 📞 Next Steps

1. **Run the check command** to see current client ID
2. **Get correct client ID** from Xero Developer Portal
3. **Update database** with correct client ID
4. **Verify Xero app configuration**
5. **Test OAuth flow**

The plug-and-play integration will automatically use the correct client ID once it's properly stored in the database! 🎉
