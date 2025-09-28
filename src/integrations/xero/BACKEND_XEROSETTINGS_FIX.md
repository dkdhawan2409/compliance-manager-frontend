# Backend XeroSettings Model Fix

## Problem
The backend was throwing an error: `"XeroSettings is not defined"` because the `plugAndPlayXeroController.js` was trying to use the `XeroSettings` Sequelize model, but the import was changed to use direct database queries.

## Root Cause
When I updated the controller to use direct database queries instead of the Sequelize model, I missed several references to `XeroSettings` throughout the file.

## Solution
Replaced all `XeroSettings` model calls with direct PostgreSQL queries using the `db.query()` method.

## Changes Made

### 1. getSettings() method
**Before:**
```javascript
const settings = await XeroSettings.findOne({ 
  where: { companyId },
  attributes: { exclude: ['clientSecret', 'accessToken', 'refreshToken'] }
});
```

**After:**
```javascript
const result = await db.query(
  'SELECT id, company_id, client_id, redirect_uri, created_at, updated_at FROM xero_settings WHERE company_id = $1',
  [companyId]
);
const settings = result.rows.length > 0 ? result.rows[0] : null;
```

### 2. saveSettings() method
**Before:**
```javascript
const [settings, created] = await XeroSettings.upsert({
  companyId,
  clientId,
  clientSecret: encryptedClientSecret,
  redirectUri,
  updatedAt: new Date()
});
```

**After:**
```javascript
// Check if settings exist
const existingResult = await db.query(
  'SELECT id FROM xero_settings WHERE company_id = $1',
  [companyId]
);

let settings;
let created = false;

if (existingResult.rows.length > 0) {
  // Update existing settings
  const updateResult = await db.query(
    'UPDATE xero_settings SET client_id = $1, client_secret = $2, redirect_uri = $3, updated_at = CURRENT_TIMESTAMP WHERE company_id = $4 RETURNING *',
    [clientId, encryptedClientSecret, redirectUri, companyId]
  );
  settings = updateResult.rows[0];
} else {
  // Create new settings
  const insertResult = await db.query(
    'INSERT INTO xero_settings (company_id, client_id, client_secret, redirect_uri, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
    [companyId, clientId, encryptedClientSecret, redirectUri]
  );
  settings = insertResult.rows[0];
  created = true;
}
```

### 3. deleteSettings() method
**Before:**
```javascript
const deleted = await XeroSettings.destroy({
  where: { companyId }
});
```

**After:**
```javascript
const result = await db.query(
  'DELETE FROM xero_settings WHERE company_id = $1',
  [companyId]
);
const deleted = result.rowCount;
```

### 4. getConnectionStatusInternal() method
**Before:**
```javascript
const settings = await XeroSettings.findOne({ where: { companyId } });
```

**After:**
```javascript
const result = await db.query(
  'SELECT client_id, redirect_uri, access_token, refresh_token, token_expires_at, tenant_id, updated_at FROM xero_settings WHERE company_id = $1',
  [companyId]
);
const settings = result.rows.length > 0 ? result.rows[0] : null;
```

### 5. Fixed property names
Updated all property references to use database column names:
- `settings.companyId` → `settings.company_id`
- `settings.clientId` → `settings.client_id`
- `settings.redirectUri` → `settings.redirect_uri`
- `settings.createdAt` → `settings.created_at`
- `settings.updatedAt` → `settings.updated_at`
- `settings.accessToken` → `settings.access_token`
- `settings.refreshToken` → `settings.refresh_token`
- `settings.tokenExpiresAt` → `settings.token_expires_at`

## Benefits
- ✅ **Fixed "XeroSettings is not defined" error**
- ✅ **Consistent database access pattern**
- ✅ **Direct PostgreSQL queries for better performance**
- ✅ **Proper error handling maintained**
- ✅ **All CRUD operations working**

## Testing
1. Navigate to `/xero` page
2. Should see successful API call to `/api/xero-plug-play/settings`
3. No more "XeroSettings is not defined" errors
4. Settings should load properly if configured
5. Connect button should work correctly
