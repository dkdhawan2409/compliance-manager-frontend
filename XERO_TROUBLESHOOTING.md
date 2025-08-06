# Xero Integration Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. **"Cannot connect to backend server" Error**

**Symptoms:**
- Network error messages
- 404 or 500 errors when trying to connect
- Console shows "Failed to fetch" errors

**Causes:**
- Backend server is not running
- Wrong API URL configuration
- CORS issues
- Network connectivity problems

**Solutions:**
1. **Check Backend Status:**
   ```bash
   # Check if backend is running on localhost:3333
   curl http://localhost:3333/api/health
   ```

2. **Verify API URL:**
   - Check browser console for the actual API URL being used
   - Ensure `VITE_API_URL` is set correctly in your environment
   - Default URL: `http://localhost:3333/api`

3. **Test API Endpoints:**
   ```bash
   # Test Xero connections endpoint
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3333/api/xero/connections
   ```

### 2. **"Xero connection has expired" Error**

**Symptoms:**
- 401 Unauthorized errors
- "Connection expired" toast messages
- OAuth tokens not working

**Causes:**
- OAuth tokens have expired
- Backend token storage issues
- Xero API rate limits

**Solutions:**
1. **Reconnect to Xero:**
   - Click "Connect Xero" button
   - Complete OAuth flow again
   - Check if new tokens are stored

2. **Check Token Storage:**
   - Verify backend is storing tokens securely
   - Check token expiration times
   - Ensure proper token refresh logic

### 3. **"Access denied" or "Forbidden" Errors**

**Symptoms:**
- 403 Forbidden responses
- "Access denied" messages
- Cannot view Xero data

**Causes:**
- Insufficient Xero permissions
- Role-based access control issues
- Missing company association

**Solutions:**
1. **Check User Permissions:**
   - Verify user has proper role (admin/company user)
   - Check company association in database
   - Ensure Xero app has required scopes

2. **Verify Company Setup:**
   - Check if company is properly configured
   - Verify company ID is set correctly
   - Check user-company relationship

### 4. **OAuth Flow Not Working**

**Symptoms:**
- Clicking "Connect Xero" does nothing
- OAuth callback not handled
- Redirect loops

**Causes:**
- Missing OAuth configuration
- Incorrect redirect URIs
- Backend OAuth endpoints not implemented

**Solutions:**
1. **Check OAuth Configuration:**
   ```javascript
   // Test OAuth initiation
   const response = await fetch('http://localhost:3333/api/xero/login', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   });
   console.log('OAuth response:', response);
   ```

2. **Verify Redirect URIs:**
   - Check Xero app settings
   - Ensure callback URL matches backend: `http://localhost:3333/api/xero/callback`
   - Test OAuth flow manually

### 5. **Data Not Loading**

**Symptoms:**
- Empty data tables
- Loading spinners that never resolve
- "No data found" messages

**Causes:**
- No Xero connections established
- API endpoints returning empty data
- Filter issues

**Solutions:**
1. **Check Connections:**
   ```javascript
   // Test connections endpoint
   const connections = await xeroService.getConnections();
   console.log('Connections:', connections);
   ```

2. **Verify Data Endpoints:**
   ```javascript
   // Test invoices endpoint
   const invoices = await xeroService.getInvoices(connectionId, {});
   console.log('Invoices:', invoices);
   ```

3. **Check Filters:**
   - Ensure filters are not too restrictive
   - Test with empty filters first
   - Check date ranges

## 🔧 Debugging Steps

### Step 1: Check Environment
```javascript
// Run in browser console
import { logEnvironmentInfo } from './src/utils/envChecker';
logEnvironmentInfo();
```

### Step 2: Test API Connectivity
```javascript
// Test basic API connectivity
fetch('http://localhost:3333/api/health')
  .then(response => console.log('Backend status:', response.status))
  .catch(error => console.error('Backend error:', error));
```

### Step 3: Check Authentication
```javascript
// Verify token is present
const token = localStorage.getItem('token');
console.log('Token present:', !!token);
console.log('Token length:', token?.length);
```

### Step 4: Test Xero Service
```javascript
// Test Xero service directly
import xeroService from './src/api/xeroService';

// Test connections
xeroService.getConnections()
  .then(connections => console.log('Connections:', connections))
  .catch(error => console.error('Connections error:', error));

// Test login initiation
xeroService.initiateLogin()
  .then(data => console.log('Login data:', data))
  .catch(error => console.error('Login error:', error));
```

### Step 5: Check Network Tab
1. Open browser DevTools
2. Go to Network tab
3. Try to connect to Xero
4. Look for failed requests
5. Check request/response details

## 🛠️ Development Setup

### Backend Requirements
```bash
# Required environment variables
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=http://localhost:3333/api/xero/callback
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your-jwt-secret
```

### Frontend Environment
```bash
# Create .env file
VITE_API_URL=http://localhost:3333/api
```

### Testing OAuth Flow
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

## 📊 Monitoring and Logs

### Frontend Logs
```javascript
// Enable detailed logging
localStorage.setItem('debug', 'xero:*');

// Check console for:
// - API requests/responses
// - OAuth flow steps
// - Error messages
// - Environment info
```

### Backend Logs
```bash
# Check backend logs for:
# - OAuth requests
# - Token storage
# - API calls to Xero
# - Error responses
```

## 🚀 Quick Fixes

### 1. Reset Everything
```javascript
// Clear all stored data
localStorage.clear();
sessionStorage.clear();
// Reload page and try again
```

### 2. Force Reconnect
```javascript
// Clear Xero connections and reconnect
localStorage.removeItem('xero_connections');
// Navigate to Xero integration page
// Click "Connect Xero"
```

### 3. Check API Status
```javascript
// Test if backend is responding
fetch('http://localhost:3333/api/health')
  .then(r => r.json())
  .then(data => console.log('Backend health:', data))
  .catch(e => console.error('Backend down:', e));
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the Debug Panel** in the Xero integration page
2. **Review browser console** for error messages
3. **Test API endpoints** manually
4. **Verify environment configuration**
5. **Check backend logs** for server-side issues

### Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Network Error" | Backend down | Check if backend is running on localhost:3333 |
| "401 Unauthorized" | Token expired | Reconnect to Xero |
| "403 Forbidden" | Permission issue | Check user role |
| "404 Not Found" | Wrong API URL | Verify VITE_API_URL is set to http://localhost:3333/api |
| "500 Server Error" | Backend issue | Check backend logs |

## ✅ Success Checklist

- [ ] Backend server is running on localhost:3333
- [ ] API URL is configured correctly (http://localhost:3333/api)
- [ ] User is authenticated with valid token
- [ ] Company ID is set correctly
- [ ] OAuth flow completes successfully
- [ ] Xero connections are established
- [ ] Data endpoints return results
- [ ] No console errors
- [ ] Network requests succeed 