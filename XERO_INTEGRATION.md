# Xero Integration Implementation

## 🎯 **Overview**

This document outlines the complete Xero integration implementation for the compliance management system, including frontend components, API services, state management, and backend requirements.

## 🏗️ **Architecture**

### **Frontend Components**
- **XeroIntegration.tsx**: Main integration page with OAuth flow and connection management
- **XeroInvoices.tsx**: Invoice data display with filtering and pagination
- **XeroDataTable.tsx**: Reusable data table component
- **ConnectionHealthBadge.tsx**: Connection status indicator

### **API Services**
- **xeroService.ts**: Complete API client with Axios configuration
- **useXeroQueries.ts**: TanStack Query hooks for data fetching
- **xeroStore.ts**: Zustand state management

### **Backend Requirements**
- OAuth2 authentication flow
- Role-based access control
- Encrypted token storage
- Webhook processing
- Sync cursor management

## 🔐 **OAuth2 Authentication Flow**

### **1. Frontend Initiation**
```typescript
// User clicks "Connect Xero"
const handleConnect = () => {
  initiateLoginMutation.mutate();
};

// Redirects to Xero OAuth
const useInitiateLogin = () => {
  return useMutation({
    mutationFn: () => xeroService.initiateLogin(),
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
  });
};
```

### **2. Backend OAuth Endpoints**
```http
GET /api/xero/login
Authorization: Bearer <jwt-token>

Response:
{
  "success": true,
  "data": {
    "authUrl": "https://login.xero.com/identity/connect/authorize?response_type=code&client_id=...",
    "state": "random-state-string"
  }
}
```

### **3. OAuth Callback Handling**
```typescript
// Handle callback in frontend
useEffect(() => {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (code && state) {
    handleCallbackMutation.mutate({ code, state });
  }
}, [searchParams]);
```

## 📊 **Data Access Implementation**

### **API Service Structure**
```typescript
class XeroService {
  // Connection Management
  async getConnections(): Promise<XeroConnection[]>
  async initiateLogin(): Promise<{ authUrl: string; state: string }>
  async handleCallback(code: string, state: string, tenantIds?: string[]): Promise<XeroConnection[]>
  async disconnectConnection(connectionId: number): Promise<void>
  async refreshConnection(connectionId: number): Promise<XeroConnection>

  // Data Access
  async getInvoices(connectionId: number, filters: XeroFilters): Promise<PaginatedResponse<XeroInvoice>>
  async getContacts(connectionId: number, filters: XeroFilters): Promise<PaginatedResponse<XeroContact>>
  async getBankTransactions(connectionId: number, filters: XeroFilters): Promise<PaginatedResponse<XeroBankTransaction>>
  async getAccounts(connectionId: number, filters: XeroFilters): Promise<PaginatedResponse<any>>
  async getItems(connectionId: number, filters: XeroFilters): Promise<PaginatedResponse<any>>

  // Sync Management
  async getSyncCursors(connectionId: number): Promise<XeroSyncCursor[]>
  async resetSyncCursor(connectionId: number, resourceType: string): Promise<void>
  async getWebhookEvents(connectionId: number, limit: number): Promise<XeroWebhookEvent[]>
}
```

### **TanStack Query Hooks**
```typescript
// Data fetching hooks
export const useXeroConnections = () => useQuery({...})
export const useXeroInvoices = (connectionId: number, filters: XeroFilters) => useQuery({...})
export const useXeroContacts = (connectionId: number, filters: XeroFilters) => useQuery({...})
export const useXeroBankTransactions = (connectionId: number, filters: XeroFilters) => useQuery({...})
export const useXeroAccounts = (connectionId: number, filters: XeroFilters) => useQuery({...})
export const useXeroItems = (connectionId: number, filters: XeroFilters) => useQuery({...})

// Mutation hooks
export const useInitiateLogin = () => useMutation({...})
export const useHandleCallback = () => useMutation({...})
export const useDisconnectConnection = () => useMutation({...})
export const useRefreshConnection = () => useMutation({...})
export const useResetSyncCursor = () => useMutation({...})
```

## 🗃️ **State Management**

### **Zustand Store Structure**
```typescript
interface XeroState {
  // State
  companyId: string | null;
  connections: XeroConnection[];
  activeConnectionId: number | null;
  status: 'idle' | 'loading' | 'connected' | 'error';
  tenants: XeroTenant[];
  selectedTenants: string[];
  syncCursors: XeroSyncCursor[];
  webhookEvents: XeroWebhookEvent[];

  // Actions
  setCompanyId: (companyId: string) => void;
  setConnections: (connections: XeroConnection[]) => void;
  setActiveConnection: (connectionId: number | null) => void;
  setStatus: (status: 'idle' | 'loading' | 'connected' | 'error') => void;
  setTenants: (tenants: XeroTenant[]) => void;
  setSelectedTenants: (tenantIds: string[]) => void;
  setSyncCursors: (cursors: XeroSyncCursor[]) => void;
  setWebhookEvents: (events: XeroWebhookEvent[]) => void;
  addConnection: (connection: XeroConnection) => void;
  removeConnection: (connectionId: number) => void;
  updateConnection: (connectionId: number, updates: Partial<XeroConnection>) => void;
  clearState: () => void;

  // Computed
  getActiveConnection: () => XeroConnection | null;
  getConnectionById: (connectionId: number) => XeroConnection | null;
  hasConnections: () => boolean;
  hasActiveConnection: () => boolean;
}
```

## 🛣️ **Routing Structure**

### **React Router Routes**
```typescript
// Main integration page
<Route path="/integrations/xero" element={<ProtectedRoute><XeroIntegration /></ProtectedRoute>} />

// Data views
<Route path="/xero/:connectionId/invoices" element={<ProtectedRoute><XeroInvoices /></ProtectedRoute>} />
<Route path="/xero/:connectionId/contacts" element={<ProtectedRoute><XeroContacts /></ProtectedRoute>} />
<Route path="/xero/:connectionId/bank-transactions" element={<ProtectedRoute><XeroBankTransactions /></ProtectedRoute>} />
<Route path="/xero/:connectionId/accounts" element={<ProtectedRoute><XeroAccounts /></ProtectedRoute>} />
<Route path="/xero/:connectionId/items" element={<ProtectedRoute><XeroItems /></ProtectedRoute>} />
```

## 🔧 **Backend API Requirements**

### **Core Endpoints**
```http
# OAuth2 Flow
GET /api/xero/login
GET /api/xero/callback?code=<auth-code>&state=<state>

# Connection Management
GET /api/xero/connections
DELETE /api/xero/connections/:id
POST /api/xero/connections/:id/refresh

# Data Access
GET /api/xero/:connectionId/invoices?page=1&pageSize=100&where=Status=="AUTHORISED"&order=Date DESC
GET /api/xero/:connectionId/contacts?page=1&pageSize=100&where=IsArchived==false&order=Name ASC
GET /api/xero/:connectionId/bank-transactions?page=1&pageSize=100&modifiedSince=2024-01-01T00:00:00Z
GET /api/xero/:connectionId/accounts?page=1&pageSize=100&where=Type=="REVENUE"
GET /api/xero/:connectionId/items?page=1&pageSize=100&order=Name ASC

# Sync Management
GET /api/xero/:connectionId/sync-cursors
POST /api/xero/:connectionId/sync-cursors/:resourceType/reset

# Webhook Events
GET /api/xero/:connectionId/webhook-events?limit=50
POST /api/xero/webhook
```

### **Response Formats**
```typescript
// Paginated Response
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Connection Response
interface XeroConnection {
  id: number;
  companyId?: number; // Only for super admin
  tenantId: string;
  tenantName: string;
  status: 'active' | 'expired' | 'disconnected';
  companyName?: string; // Only for super admin
}
```

## 🔐 **Security Features**

### **Frontend Security**
- No secrets stored in browser
- JWT token authentication on all requests
- Automatic token handling via Axios interceptors
- Error handling for 401/expired connections

### **Backend Security Requirements**
- Encrypted OAuth token storage (AES-256-GCM)
- Role-based access control
- HMAC-SHA256 webhook signature verification
- Rate limiting (max 5 concurrent requests)

## 📊 **Data Display Features**

### **XeroDataTable Component**
```typescript
interface XeroDataTableProps<T> {
  data: PaginatedResponse<T> | undefined;
  columns: Column<T>[];
  isLoading: boolean;
  onFiltersChange: (filters: XeroFilters) => void;
  filters: XeroFilters;
  title: string;
  connectionName: string;
  onRefresh?: () => void;
}
```

### **Features**
- ✅ Filtering and searching
- ✅ Sorting by columns
- ✅ Pagination with page size selection
- ✅ Loading states
- ✅ Error handling
- ✅ Refresh functionality
- ✅ Responsive design

## 🔄 **Connection Health Monitoring**

### **ConnectionHealthBadge Component**
```typescript
const ConnectionHealthBadge: React.FC<ConnectionHealthBadgeProps> = ({ 
  connectionId, 
  className = '' 
}) => {
  const { isActive, isExpired, isDisconnected, status } = useConnectionStatus(connectionId);
  // Returns color-coded status badge
};
```

### **Status Indicators**
- 🟢 **Connected**: Active connection
- 🟡 **Expired**: Token expired, needs refresh
- 🔴 **Disconnected**: Connection lost
- ⚪ **Unknown**: Status unclear

## 🚀 **Usage Examples**

### **Connecting to Xero**
```typescript
// 1. User clicks "Connect Xero"
const handleConnect = () => {
  initiateLoginMutation.mutate();
};

// 2. Redirected to Xero OAuth
// 3. User authorizes application
// 4. Callback handled automatically
// 5. Connections stored in Zustand store
```

### **Viewing Invoice Data**
```typescript
// 1. Navigate to invoices page
navigate(`/xero/${connectionId}/invoices`);

// 2. Data fetched via TanStack Query
const { data: invoicesData, isLoading } = useXeroInvoices(connectionId, filters);

// 3. Displayed in XeroDataTable component
<XeroDataTable
  data={invoicesData}
  columns={invoiceColumns}
  isLoading={isLoading}
  onFiltersChange={handleFiltersChange}
  filters={filters}
  title="Invoices"
  connectionName={connection.tenantName}
/>
```

### **Managing Connections**
```typescript
// Set active connection
setActiveConnection(connectionId);

// Refresh connection
refreshConnectionMutation.mutate(connectionId);

// Disconnect connection
disconnectConnectionMutation.mutate(connectionId);
```

## 📈 **Performance Optimizations**

### **Caching Strategy**
- **Connections**: 5 minutes stale time
- **Data queries**: 2 minutes stale time
- **Sync cursors**: 1 minute stale time
- **Webhook events**: 30 seconds stale time

### **Error Handling**
- Automatic retry on 429/5xx errors
- Exponential backoff for failed requests
- Graceful handling of expired tokens
- User-friendly error messages

## 🔧 **Environment Configuration**

### **Required Environment Variables**
```bash
# Frontend
VITE_API_URL=https://your-backend-domain.com/api

# Backend (for implementation)
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://your-domain.com/api/xero/callback
XERO_WEBHOOK_SIGNING_KEY=your-webhook-signing-key
DATABASE_URL=postgresql://username:password@localhost:5432/database
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret
```

## ✅ **Implementation Status**

### **Frontend Complete**
- ✅ OAuth2 authentication flow
- ✅ Role-based access control
- ✅ Data fetching with TanStack Query
- ✅ State management with Zustand
- ✅ Reusable data table component
- ✅ Connection health monitoring
- ✅ Error handling and toasts
- ✅ Responsive UI design

### **Backend Requirements**
- ⏳ OAuth2 endpoints implementation
- ⏳ Role-based access control
- ⏳ Encrypted token storage
- ⏳ Data proxy endpoints
- ⏳ Webhook processing
- ⏳ Sync cursor management
- ⏳ Rate limiting and error handling

## 🎯 **Next Steps**

1. **Implement Backend API** according to the specification
2. **Add Missing Data Views** (Contacts, Bank Transactions, Accounts, Items)
3. **Implement Sync Management** UI for cursors and webhooks
4. **Add Advanced Filtering** with date ranges and status filters
5. **Implement Export Functionality** for data downloads
6. **Add Real-time Updates** via webhook processing

The frontend implementation is complete and ready for backend integration! 