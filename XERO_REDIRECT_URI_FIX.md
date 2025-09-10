# Xero Redirect URI Fix Guide

## Error: unauthorized_client - Invalid redirect_uri

This error occurs when the redirect URI sent to Xero doesn't match what's configured in your Xero app.

## Step 1: Check Current Redirect URI

1. Open your app in the browser
2. Go to Xero Integration page
3. Look at the "Current Domain Detection" section in Xero Settings
4. Note the exact redirect URI being generated

## Step 2: Update Xero App Configuration

### In Xero Developer Portal (https://developer.xero.com/):

1. Go to your app
2. Click on "Configuration"
3. In the "Redirect URIs" section, add these URIs:

**For Development:**
```
http://localhost:3000/redirecturl
http://localhost:3001/redirecturl
http://localhost:3002/redirecturl
```

**For Production (Render):**
```
https://compliance-manager-frontend.onrender.com/redirecturl
```

### Important Notes:
- The redirect URI must be EXACTLY the same (including protocol, domain, port, and path)
- No trailing slashes
- Case sensitive
- Must include the full path `/redirecturl`

## Step 3: Verify Environment Variables

### For Production (Render Dashboard):
```
VITE_FRONTEND_URL=https://compliance-manager-frontend.onrender.com
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
```

### For Development (.env.local file):
```
VITE_FRONTEND_URL=http://localhost:3002
VITE_API_URL=http://localhost:3333/api
```

## Step 4: Test the Flow

1. Clear browser cache and localStorage
2. Try the OAuth flow again
3. Check browser console for redirect URI logs
4. Verify the redirect URI matches what's in Xero app

## Common Issues:

1. **Port Mismatch**: If your dev server runs on port 3002, make sure Xero app has that port
2. **Protocol Mismatch**: Make sure you're using `http://` for localhost and `https://` for production
3. **Path Mismatch**: Must be exactly `/redirecturl` (not `/redirect` or `/callback`)
4. **Environment Variables**: Make sure `VITE_FRONTEND_URL` is set correctly

## Debug Information:

The app now shows debug information in the Xero Settings page:
- Current Domain
- Environment (Production/Development)
- VITE_FRONTEND_URL value

Use this information to verify the redirect URI is correct.
