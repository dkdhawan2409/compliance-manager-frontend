# Xero Credentials Fix - "Invalid Client" Error Resolution

## 🎯 Problem

Error message: **"Xero client credentials invalid. Please update Client ID and Client Secret."**

This error occurs when:
1. The Xero Client ID and Client Secret are missing from the database
2. The credentials have expired or been revoked
3. The wrong credentials are being used for token refresh

---

## ✅ Solution Deployed

### Backend Fix (Already Pushed)

Updated `xeroAuthService.js` to use **per-company credentials** from the database instead of global environment variables.

**Changes Made:**
```javascript
// OLD: Always used global env variables
client_id: this.config.clientId,  // From process.env
client_secret: this.config.clientSecret  // From process.env

// NEW: Uses per-company credentials from database, fallback to global
const clientId = connection.client_id || this.config.clientId;
const clientSecret = decryptTokenIfNeeded(connection.client_secret) || this.config.clientSecret;
```

---

## 🔧 How to Fix Your Xero Connection

### Option 1: Reconnect to Xero (Recommended)

1. **Navigate to Xero Integration Page**
   - Go to `/xero` on your frontend
   - https://compliance-manager-frontend.onrender.com/xero

2. **Disconnect Current Connection**
   - Click "Disconnect" button if you see one
   - This clears invalid credentials

3. **Reconnect to Xero**
   - Click "Connect to Xero" button
   - Complete the OAuth flow
   - This will save fresh credentials to the database

---

### Option 2: Check Database Credentials

If reconnecting doesn't work, the credentials might be missing in the database.

#### Check xero_connections table:

```sql
SELECT 
  company_id,
  client_id,
  client_secret,
  access_token_encrypted,
  refresh_token_encrypted,
  access_token_expires_at,
  status
FROM xero_connections
WHERE company_id = YOUR_COMPANY_ID;
```

**Required Fields:**
- ✅ `client_id` - Must be present
- ✅ `client_secret` - Must be present (encrypted)
- ✅ `refresh_token_encrypted` - Must be present
- ✅ `access_token_encrypted` - Must be present
- ✅ `access_token_expires_at` - Should be in the future or will trigger refresh

---

### Option 3: Set Up Xero App (If Starting Fresh)

If you don't have a Xero app set up:

1. **Go to Xero Developer Portal**
   - https://developer.xero.com/app/manage

2. **Create or Select Your App**
   - Click "New app" or select existing app
   - Choose "Web app" type

3. **Get Credentials**
   - Copy your **Client ID**
   - Generate and copy your **Client Secret**
   - Set **Redirect URI** to: `https://compliance-manager-backend.onrender.com/api/xero/callback`

4. **Add OAuth 2.0 Scopes**
   Required scopes:
   - `offline_access` (for refresh tokens)
   - `openid`
   - `profile`
   - `email`
   - `accounting.transactions`
   - `accounting.settings`
   - `accounting.reports.read`
   - `accounting.contacts`

5. **Save Credentials**
   These will be automatically saved when you complete the OAuth flow in your app.

---

## 🔍 How the Fix Works

### Before (Broken)
```
User tries to load BAS data
  ↓
Token is expired
  ↓
Backend tries to refresh token
  ↓
Uses global env XERO_CLIENT_ID (missing/wrong)
  ↓
Xero API returns: "invalid_client"
  ↓
ERROR ❌
```

### After (Fixed)
```
User tries to load BAS data
  ↓
Token is expired
  ↓
Backend tries to refresh token
  ↓
Uses client_id from xero_connections table (per-company)
  ↓
If not found, falls back to global env vars
  ↓
If neither found, shows clear error message
  ↓
Xero API accepts credentials
  ↓
SUCCESS ✅
```

---

## 🚀 Deployment Status

**Backend Changes:**
- ✅ Commit: `c480a60`
- ✅ Message: "Fix invalid_client error - use per-company Xero credentials"
- ✅ Pushed to: `main` branch
- ⏳ Render deployment: 2-5 minutes

---

## 📋 Testing After Deployment

### 1. Check if Credentials Are in Database

**SQL Query:**
```sql
SELECT 
  company_id,
  CASE WHEN client_id IS NOT NULL THEN '✅ Present' ELSE '❌ Missing' END as client_id_status,
  CASE WHEN client_secret IS NOT NULL THEN '✅ Present' ELSE '❌ Missing' END as client_secret_status,
  CASE WHEN refresh_token_encrypted IS NOT NULL THEN '✅ Present' ELSE '❌ Missing' END as refresh_token_status,
  status,
  access_token_expires_at
FROM xero_connections
WHERE company_id = YOUR_COMPANY_ID;
```

**Expected Result:**
- All should show `✅ Present`
- `status` should be `'active'` or `'connected'`

---

### 2. Test BAS Data Loading

1. **Navigate to Xero Page**
   - Go to `/xero` on frontend

2. **Select Organization and Date Range**

3. **Click "Load BAS Data"**

4. **Check Console for Logs:**
   - Should see: `🔐 Using per-company credentials for token refresh`
   - Should NOT see: `❌ Xero client credentials invalid`

5. **Verify Data Loads**
   - BAS data should load successfully
   - No 404 or invalid_client errors

---

## 🆘 Troubleshooting

### Error: "Xero client credentials not found"

**Cause:** No credentials in database AND no global env vars set.

**Solution:**
1. Reconnect to Xero via OAuth flow
2. OR manually insert credentials into database
3. OR set global env vars: `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`

---

### Error: "Xero client credentials are invalid or expired"

**Cause:** Credentials exist but are wrong or revoked.

**Solution:**
1. Go to Xero Developer Portal
2. Verify your app is still active
3. Check if Client Secret has been regenerated
4. Reconnect to Xero to get fresh credentials

---

### Error: "Xero authorization expired. Please reconnect to Xero."

**Cause:** Refresh token is invalid (different from client credentials).

**Solution:**
1. This is expected after long periods of inactivity
2. Simply reconnect to Xero
3. OAuth flow will generate new refresh token

---

## 🔐 Security Notes

### Credentials Storage

1. **Client Secret** - Encrypted in database using CryptoJS AES
2. **Access Token** - Encrypted in database
3. **Refresh Token** - Encrypted in database
4. **Encryption Key** - Stored in `XERO_TOKEN_ENCRYPTION_KEY` env var

### Per-Company vs Global Credentials

- **Per-Company** (Recommended): Each company has its own Xero app
  - Stored in `xero_connections.client_id` and `xero_connections.client_secret`
  - More secure, isolated per tenant

- **Global** (Fallback): Single Xero app for all companies
  - Stored in `process.env.XERO_CLIENT_ID` and `process.env.XERO_CLIENT_SECRET`
  - Simpler setup, but less flexible

---

## 📝 Files Modified

### Backend
- `src/services/xeroAuthService.js` - Updated `refreshAccessToken()` method
  - Now reads `client_id` and `client_secret` from `xero_connections` table
  - Falls back to global env vars if not found
  - Better error messages

---

## ✅ Success Criteria

All issues are resolved when:
1. ✅ BAS data loads without "invalid_client" error
2. ✅ Console shows "Using per-company credentials for token refresh"
3. ✅ Token refresh works automatically
4. ✅ No manual intervention needed after initial OAuth setup

---

## 📞 Still Having Issues?

If the error persists after:
1. ✅ Waiting for deployment (5+ minutes)
2. ✅ Reconnecting to Xero
3. ✅ Verifying database has credentials

**Check These:**

1. **Database Connection**
   ```sql
   SELECT * FROM xero_connections WHERE company_id = YOUR_ID;
   ```
   - Verify row exists
   - Verify `client_id` and `client_secret` are not NULL

2. **Xero App Status**
   - Go to https://developer.xero.com/app/manage
   - Verify app is active
   - Verify redirect URI matches backend URL

3. **Backend Logs**
   - Check Render backend logs for:
     ```
     ❌ Xero client credentials invalid
     🔐 Using per-company credentials for token refresh
     ```

4. **Environment Variables** (if using global credentials)
   - Verify in Render dashboard:
     - `XERO_CLIENT_ID` is set
     - `XERO_CLIENT_SECRET` is set
     - `XERO_TOKEN_ENCRYPTION_KEY` is set

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Backend fix deployed, awaiting Render deployment  
**Recommended Action:** Reconnect to Xero after deployment completes
