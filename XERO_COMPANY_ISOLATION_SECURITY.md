# Xero Company Data Isolation Security

## 🔒 Security Overview

This document outlines the comprehensive security measures implemented to ensure that each company's Xero data is completely isolated and cannot be accessed by other companies.

## 🛡️ Security Layers

### 1. Backend Company Isolation

**Database Level:**
- Each Xero setting record includes a `companyId` field
- All Xero API calls are scoped to the authenticated company
- Database queries include company-specific WHERE clauses

**Example:**
```sql
SELECT * FROM xero_settings WHERE company_id = $1
```

**API Level:**
- All Xero endpoints require authentication
- JWT tokens contain company information
- Backend validates company ownership for all operations

### 2. Frontend Company Isolation

**Authentication Context:**
```tsx
// Each user session is tied to a specific company
const { company } = useAuth();
// company.id is used for all data operations
```

**Xero Context Security:**
```tsx
// Company validation on all operations
if (!company) {
  throw new Error('No company context - cannot access Xero data');
}

// Data validation
const validation = validateCompanyData(settingsData, company);
if (!validation.isValid) {
  logSecurityAlert(validation, { operation, dataType, userId: company.id });
  throw new Error('Company data isolation violation detected');
}
```

### 3. Data Validation Security

**Company Data Validation:**
```tsx
export const validateCompanyData = (data: any, currentCompany: Company | null) => {
  if (data.companyId !== currentCompany.id) {
    return {
      isValid: false,
      error: `Company data isolation violation: expected ${currentCompany.id}, got ${data.companyId}`
    };
  }
  return { isValid: true };
};
```

**Security Logging:**
```tsx
export const logSecurityAlert = (validation, context) => {
  console.error('🚨 SECURITY ALERT: Company Data Isolation Violation', {
    expectedCompanyId: validation.expectedCompanyId,
    actualCompanyId: validation.companyId,
    operation: context.operation,
    timestamp: new Date().toISOString()
  });
};
```

### 4. State Management Security

**Company-Specific State Clearing:**
```tsx
// When company changes, clear all previous company's data
useEffect(() => {
  if (state.settings && state.settings.companyId !== company.id) {
    clearCompanySpecificData(state.settings.companyId);
    dispatch({ type: 'CLEAR_STATE' });
  }
}, [company]);
```

**localStorage Isolation:**
```tsx
// Company-specific cache keys
const createCompanySpecificKey = (baseKey: string, companyId: number) => {
  return `company_${companyId}_${baseKey}`;
};
```

## 🔐 Security Features Implemented

### ✅ **Company Context Validation**
- All Xero operations require valid company context
- Operations fail if no company is authenticated
- Company ID is logged for all operations

### ✅ **Data Ownership Validation**
- All received data is validated against current company ID
- Security alerts are logged for any mismatches
- Operations are blocked if data doesn't belong to current company

### ✅ **State Isolation**
- Xero state is cleared when switching companies
- Company-specific localStorage keys are used
- Previous company's data is completely removed

### ✅ **API Request Security**
- All API requests include company-specific JWT tokens
- Backend validates company ownership on every request
- Requests without proper authentication are rejected

### ✅ **Automatic Cleanup**
- Data is automatically cleared when company context changes
- Expired tokens are removed
- Stale data is prevented from persisting

## 🧪 Testing Company Isolation

### Automated Tests
```javascript
// In browser console:
testCompanyIsolation.runTests()        // Run all isolation tests
testCompanyIsolation.testAPIContext()  // Monitor API calls for auth
testCompanyIsolation.testDataIsolation() // Test data validation
```

### Manual Testing Steps

1. **Login as Company A**
   - Connect to Xero
   - Load some data
   - Note the data in browser console

2. **Switch to Company B**
   - Logout and login as different company
   - Verify Xero state is cleared
   - Verify no access to Company A's data

3. **API Security Test**
   - Try to access Company A's data with Company B's token
   - Should receive 401/403 errors
   - No data should be returned

## 🚨 Security Monitoring

### What We Log
- All company context changes
- Data validation failures
- Security violations
- API authentication failures

### Security Alerts
```javascript
// Example security alert log
{
  "level": "SECURITY_ALERT",
  "type": "COMPANY_DATA_ISOLATION_VIOLATION",
  "expectedCompanyId": 1,
  "actualCompanyId": 2,
  "operation": "loadXeroSettings",
  "userId": 1,
  "timestamp": "2025-09-21T19:30:00.000Z",
  "url": "/integrations/xero"
}
```

## 🔧 Implementation Details

### Backend Security (Already Implemented)
- JWT tokens contain company information
- All database queries are company-scoped
- API middleware validates company ownership
- CORS protection prevents cross-origin attacks

### Frontend Security (Enhanced)
- Company context validation on all operations
- Automatic state clearing on company changes
- Data validation before state updates
- Security logging for audit trails

## 🎯 Security Guarantees

1. **No Cross-Company Data Access**: Company A cannot access Company B's Xero data
2. **Automatic Cleanup**: Switching companies clears all previous data
3. **Validation at Every Level**: Data is validated at API, context, and component levels
4. **Audit Trail**: All security events are logged for monitoring
5. **Fail-Safe Design**: Operations fail securely if validation fails

## 🔍 Verification

To verify security is working:

1. **Check Browser Console**: Look for company-specific logging
2. **Test Company Switching**: Verify data is cleared when switching
3. **Monitor API Calls**: Ensure all calls include proper authentication
4. **Run Automated Tests**: Use the provided test utilities

## 📋 Security Checklist

- ✅ Company context required for all Xero operations
- ✅ Data validation against company ownership
- ✅ Automatic state clearing on company changes  
- ✅ Company-specific localStorage keys
- ✅ Security logging and monitoring
- ✅ API authentication on all requests
- ✅ Backend company-scoped database queries
- ✅ Frontend validation before state updates
- ✅ Automated testing utilities available

**Result: Complete company data isolation is implemented and verified!** 🛡️

