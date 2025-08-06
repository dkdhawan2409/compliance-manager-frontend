# Xero Integration - Role-Based Access Control

## 🎯 **Overview**

The Xero integration has been implemented with strict role-based access control (RBAC) to ensure that only company users can access Xero functionality, while super admins are restricted from accessing these features.

## 🔐 **Access Control Rules**

### **Company Users (Regular Companies)**
- ✅ **Full Access** to Xero integration
- ✅ Can connect to Xero via OAuth2
- ✅ Can view invoices, contacts, bank transactions
- ✅ Can manage Xero connections
- ✅ Can refresh and disconnect connections
- ✅ Can access all Xero data endpoints

### **Super Admins**
- ❌ **No Access** to Xero integration
- ❌ Cannot see Xero integration links in navigation
- ❌ Cannot access Xero pages (redirected with error)
- ❌ Cannot perform OAuth2 authentication
- ❌ Cannot view or manage Xero data

## 🏗️ **Implementation Details**

### **1. Role Detection System**

```typescript
// src/utils/roleUtils.ts
export interface UserRole {
  isCompany: boolean;
  isSuperAdmin: boolean;
  canAccessXero: boolean;
  canManageIntegrations: boolean;
}

export const getUserRole = (company: Company | null): UserRole => {
  const isSuperAdmin = company.superadmin === true;
  const isCompany = !isSuperAdmin;

  return {
    isCompany,
    isSuperAdmin,
    canAccessXero: isCompany, // Only companies can access Xero
    canManageIntegrations: isCompany,
  };
};
```

### **2. Protected Route Component**

```typescript
// src/components/XeroProtectedRoute.tsx
const XeroProtectedRoute: React.FC<XeroProtectedRouteProps> = ({ children }) => {
  const { company, loading } = useAuth();
  const userRole = useUserRole(company);

  if (!userRole.canAccessXero) {
    return <AccessDeniedComponent />;
  }

  return <>{children}</>;
};
```

### **3. Navigation Filtering**

```typescript
// src/components/SidebarLayout.tsx
{navLinks.map(link => {
  // Skip company-only links for super admins
  if ('companyOnly' in link && link.companyOnly && userRole.isSuperAdmin) {
    return null;
  }
  
  return <Link key={link.to} to={link.to}>...</Link>;
})}
```

## 📋 **Access Control Matrix**

| Feature | Company Users | Super Admins |
|---------|---------------|--------------|
| Xero Integration Link | ✅ Visible | ❌ Hidden |
| OAuth2 Authentication | ✅ Allowed | ❌ Blocked |
| View Invoices | ✅ Allowed | ❌ Blocked |
| View Contacts | ✅ Allowed | ❌ Blocked |
| View Bank Transactions | ✅ Allowed | ❌ Blocked |
| Manage Connections | ✅ Allowed | ❌ Blocked |
| Debug Tools | ✅ Available | ❌ Blocked |

## 🔄 **OAuth2 Flow for Companies**

### **Step-by-Step Process:**

1. **Company User Logs In**
   - System detects `company.superadmin = false`
   - User gets `canAccessXero = true`

2. **User Navigates to Xero Integration**
   - Sidebar shows "Xero Integration" link
   - User can access `/integrations/xero`

3. **OAuth2 Authentication**
   - User clicks "Connect Xero"
   - System initiates OAuth2 flow
   - User authorizes on Xero
   - Callback stores tokens for company

4. **Data Access**
   - Company can view their Xero data
   - All API calls include company ID
   - Data is scoped to company's Xero account

## 🚫 **Super Admin Restrictions**

### **Navigation Level:**
- Xero integration link is hidden from sidebar
- No access to `/integrations/xero` route
- No access to `/xero/*` routes

### **Page Level:**
- Access attempts show "Access Restricted" message
- Automatic redirect to dashboard
- Clear explanation of why access is denied

### **API Level:**
- Backend validates user role before processing Xero requests
- Returns 403 Forbidden for super admin attempts
- Logs unauthorized access attempts

## 🛡️ **Security Features**

### **Frontend Security:**
- Role-based component rendering
- Navigation link filtering
- Route protection with access denied pages
- Automatic redirects for unauthorized access

### **Backend Security:**
- Role validation on all Xero endpoints
- Company-scoped data access
- OAuth token storage per company
- Audit logging for access attempts

## 📊 **User Experience**

### **For Company Users:**
```
✅ Login as Company User
✅ See "Xero Integration" in sidebar
✅ Click to access integration page
✅ Complete OAuth2 flow
✅ View and manage Xero data
✅ Full integration functionality
```

### **For Super Admins:**
```
❌ Login as Super Admin
❌ No "Xero Integration" in sidebar
❌ Cannot access Xero pages
❌ See access denied message if trying
❌ Redirected to dashboard
```

## 🔧 **Configuration**

### **Environment Variables:**
```bash
# Backend
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://compliance-manager-backend.onrender.com/api/xero/callback

# Frontend
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
```

### **Database Schema:**
```sql
-- Companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255),
  email VARCHAR(255),
  superadmin BOOLEAN DEFAULT FALSE, -- Key field for role detection
  -- ... other fields
);

-- Xero connections table
CREATE TABLE xero_connections (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id), -- Links to company
  tenant_id VARCHAR(255),
  tenant_name VARCHAR(255),
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  -- ... other fields
);
```

## 🧪 **Testing**

### **Test Cases:**

1. **Company User Access:**
   ```bash
   # Login as company user
   # Verify Xero link appears in sidebar
   # Verify can access integration page
   # Verify OAuth flow works
   # Verify can view data
   ```

2. **Super Admin Restrictions:**
   ```bash
   # Login as super admin
   # Verify Xero link is hidden
   # Verify cannot access Xero pages
   # Verify access denied messages
   ```

3. **API Security:**
   ```bash
   # Test Xero endpoints with super admin token
   # Verify 403 responses
   # Verify proper error messages
   ```

## 📝 **Error Messages**

### **Access Denied Page:**
```
🚫 Access Restricted

Xero integration is only available for company users.
Super admins cannot access Xero integration.

Your Role: Super Admin
Xero Access: Not Allowed

[Back to Dashboard]
```

### **Toast Notifications:**
- "Xero integration is only available for company users."
- "Access denied. Please check your permissions."

## ✅ **Implementation Checklist**

- [x] Role detection system implemented
- [x] Protected route component created
- [x] Navigation filtering implemented
- [x] Access denied pages created
- [x] OAuth2 flow restricted to companies
- [x] API endpoints protected
- [x] Error handling implemented
- [x] User experience optimized
- [x] Security logging added
- [x] Testing completed

## 🚀 **Benefits**

1. **Security**: Prevents unauthorized access to Xero data
2. **Compliance**: Ensures data isolation between companies
3. **User Experience**: Clear feedback on access restrictions
4. **Maintainability**: Centralized role management
5. **Scalability**: Easy to extend for other integrations

The Xero integration now properly restricts access to company users only, with super admins being completely blocked from accessing any Xero functionality while maintaining full access to other admin features. 