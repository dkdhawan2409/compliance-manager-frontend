# Xero Integration - Plug and Play Package

A comprehensive, self-contained Xero integration package for React applications. This package provides everything you need to integrate Xero accounting data into your application with minimal setup.

## 🚀 Features

- **Complete OAuth 2.0 Flow** - Secure authentication with Xero
- **Real-time Data Access** - Invoices, contacts, accounts, transactions, and more
- **Automatic Token Management** - Handles token refresh and expiration
- **Demo Mode Support** - Test without real Xero data
- **TypeScript Support** - Full type safety and IntelliSense
- **Material-UI Components** - Beautiful, responsive UI components
- **Error Handling** - Comprehensive error handling and user feedback
- **Rate Limiting** - Built-in protection against API rate limits
- **Company Isolation** - Secure multi-tenant data access

## 📦 Installation

```bash
# Copy the integrations/xero folder to your project
# No additional dependencies required - uses existing project dependencies
```

## 🔧 Quick Start

### 1. Basic Setup

```tsx
import { XeroProvider, XeroConnect, XeroDashboard } from './integrations/xero';

function App() {
  return (
    <XeroProvider config={{
      clientId: 'your-xero-client-id',
      redirectUri: 'https://yourdomain.com/xero-callback',
      scopes: ['offline_access', 'accounting.transactions', 'accounting.contacts'],
      apiBaseUrl: '/api/xero',
      autoRefreshTokens: true,
      enableDemoMode: false,
    }}>
      <div className="App">
        <XeroConnect />
        <XeroDashboard />
      </div>
    </XeroProvider>
  );
}
```

### 2. Using the Hook

```tsx
import { useXero } from './integrations/xero';

function MyComponent() {
  const { state, loadData, startAuth, disconnect } = useXero();
  const { isConnected, tenants, selectedTenant } = state;

  const loadInvoices = async () => {
    if (isConnected && selectedTenant) {
      const response = await loadData({
        resourceType: 'invoices',
        tenantId: selectedTenant.id,
        page: 1,
        pageSize: 50,
      });
      console.log('Invoices:', response.data);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected to: {selectedTenant?.name}</p>
          <button onClick={loadInvoices}>Load Invoices</button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={startAuth}>Connect to Xero</button>
      )}
    </div>
  );
}
```

### 3. Using Individual Components

```tsx
import { 
  XeroConnect, 
  XeroDashboard, 
  XeroDataTable, 
  XeroSettings, 
  XeroStatusBadge 
} from './integrations/xero';

function XeroPage() {
  return (
    <div>
      {/* Connection Status */}
      <XeroStatusBadge showMessage />
      
      {/* Settings Management */}
      <XeroSettings onSettingsChange={(settings) => console.log(settings)} />
      
      {/* Connect Button */}
      <XeroConnect 
        onSuccess={(result) => console.log('Connected:', result)}
        onError={(error) => console.error('Error:', error)}
      />
      
      {/* Dashboard */}
      <XeroDashboard 
        showSummary
        showRecentData
        onDataLoad={(data) => console.log('Dashboard data:', data)}
      />
      
      {/* Data Tables */}
      <XeroDataTable 
        resourceType="invoices"
        pageSize={25}
        showPagination
        showFilters
        onRowClick={(invoice) => console.log('Invoice clicked:', invoice)}
      />
    </div>
  );
}
```

## 🏗️ Architecture

### Core Components

1. **XeroProvider** - React context provider managing global state
2. **useXero** - Custom hook for accessing Xero functionality
3. **XeroApiClient** - API client with automatic token management
4. **Components** - Pre-built UI components for common use cases

### Data Flow

```
User Action → Component → useXero Hook → XeroProvider → XeroApiClient → Backend API → Xero API
```

### State Management

- **React Context** - Global state management
- **useReducer** - Predictable state updates
- **Local Storage** - Persistent token storage
- **Automatic Refresh** - Background token renewal

## 🔐 Security Features

- **Secure Token Storage** - Encrypted token storage in localStorage
- **Automatic Token Refresh** - Seamless token renewal
- **Company Isolation** - Multi-tenant data separation
- **Rate Limiting** - Protection against API abuse
- **Error Boundaries** - Graceful error handling

## 📊 Available Data Types

### Core Resources
- **Invoices** - Sales invoices and billing data
- **Contacts** - Customers and suppliers
- **Accounts** - Chart of accounts
- **Bank Transactions** - Banking and payment data
- **Organization** - Company information

### Extended Resources
- **Items** - Products and services
- **Tax Rates** - Tax configurations
- **Tracking Categories** - Custom categorization
- **Purchase Orders** - Purchase management
- **Receipts** - Expense receipts
- **Credit Notes** - Credit and refunds
- **Manual Journals** - Manual accounting entries
- **Prepayments** - Advance payments
- **Overpayments** - Excess payments
- **Quotes** - Sales quotes
- **Reports** - Financial reports

## 🎨 Customization

### Custom Configuration

```tsx
const customConfig = {
  clientId: 'your-client-id',
  redirectUri: 'https://yourdomain.com/callback',
  scopes: ['offline_access', 'accounting.transactions'],
  apiBaseUrl: '/api/xero',
  autoRefreshTokens: true,
  enableDemoMode: false,
  environment: 'production', // or 'sandbox'
};

<XeroProvider config={customConfig}>
  {/* Your components */}
</XeroProvider>
```

### Custom Components

```tsx
import { useXero } from './integrations/xero';

function CustomXeroWidget() {
  const { state, loadData } = useXero();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (state.isConnected) {
      loadData({ resourceType: 'invoices' }).then(response => {
        setInvoices(response.data);
      });
    }
  }, [state.isConnected]);

  return (
    <div>
      {invoices.map(invoice => (
        <div key={invoice.InvoiceID}>
          {invoice.InvoiceNumber} - ${invoice.Total}
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Configuration Options

### XeroConfig Interface

```typescript
interface XeroConfig {
  clientId: string;                    // Xero app client ID
  clientSecret?: string;               // Xero app client secret (optional for OAuth)
  redirectUri: string;                 // OAuth redirect URI
  scopes: string[];                    // Xero API scopes
  apiBaseUrl: string;                  // Backend API base URL
  autoRefreshTokens: boolean;          // Enable automatic token refresh
  enableDemoMode: boolean;             // Enable demo mode for testing
  environment?: 'sandbox' | 'production'; // Xero environment
}
```

### Available Scopes

```typescript
const scopes = [
  'offline_access',                    // Refresh tokens
  'accounting.transactions',           // Read/write transactions
  'accounting.contacts',               // Read/write contacts
  'accounting.settings',               // Read/write settings
  'accounting.transactions.read',      // Read-only transactions
  'accounting.contacts.read',          // Read-only contacts
  'accounting.settings.read',          // Read-only settings
  'accounting.attachments',            // File attachments
  'accounting.reports.read',           // Financial reports
  'accounting.journals.read',          // Journal entries
  'accounting.payroll.employees',      // Payroll employees
  'accounting.payroll.payruns',        // Payroll pay runs
  'accounting.payroll.timesheets',     // Payroll timesheets
  'accounting.payroll.payslip',        // Payroll payslips
  'accounting.payroll.settings',       // Payroll settings
  'accounting.budgets',                // Budget management
  'accounting.reports.tenninetynine',  // BAS reports
];
```

## 🚨 Error Handling

### Built-in Error Types

```typescript
// Connection errors
'UNAUTHORIZED' - Authentication failed
'FORBIDDEN' - Insufficient permissions
'NOT_FOUND' - Resource not found
'RATE_LIMIT_EXCEEDED' - API rate limit exceeded
'NETWORK_ERROR' - Network connectivity issues
'SERVER_ERROR' - Backend server error

// OAuth errors
'INVALID_CLIENT' - Invalid client credentials
'INVALID_GRANT' - Invalid authorization grant
'INVALID_REQUEST' - Malformed request
'ACCESS_DENIED' - User denied access
'EXPIRED_TOKEN' - Token has expired
```

### Error Handling Example

```tsx
import { useXero } from './integrations/xero';

function MyComponent() {
  const { state, loadData } = useXero();
  const { error } = state;

  const handleDataLoad = async () => {
    try {
      const response = await loadData({ resourceType: 'invoices' });
      // Handle success
    } catch (error) {
      if (error.message.includes('UNAUTHORIZED')) {
        // Redirect to login
      } else if (error.message.includes('RATE_LIMIT')) {
        // Show rate limit message
      } else {
        // Show generic error
      }
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleDataLoad}>Load Data</button>
    </div>
  );
}
```

## 🧪 Testing

### Demo Mode

```tsx
<XeroProvider config={{
  ...config,
  enableDemoMode: true, // Enables demo data for testing
}}>
  {/* Components will use demo data instead of real Xero data */}
</XeroProvider>
```

### Mock Data

```typescript
import { XERO_DEMO_DATA } from './integrations/xero/constants';

// Use demo data in tests
const mockInvoices = XERO_DEMO_DATA.INVOICES;
const mockContacts = XERO_DEMO_DATA.CONTACTS;
```

## 📱 Responsive Design

All components are built with Material-UI and are fully responsive:

- **Mobile-first** - Optimized for mobile devices
- **Tablet-friendly** - Adapts to tablet layouts
- **Desktop-optimized** - Full feature set on desktop
- **Accessible** - WCAG 2.1 compliant

## 🔄 State Management

### Global State

```typescript
interface XeroState {
  tokens: XeroTokens | null;           // OAuth tokens
  tenants: XeroTenant[];               // Available organizations
  selectedTenant: XeroTenant | null;   // Currently selected organization
  settings: XeroSettings | null;       // Integration settings
  connectionStatus: XeroConnectionStatus | null; // Connection status
  isLoading: boolean;                  // Loading state
  error: string | null;                // Error messages
  isConnected: boolean;                // Connection status
  hasSettings: boolean;                // Settings configured
  isDemoMode: boolean;                 // Demo mode enabled
}
```

### State Updates

```typescript
// All state updates go through the reducer
dispatch({ type: 'SET_LOADING', payload: true });
dispatch({ type: 'SET_TOKENS', payload: newTokens });
dispatch({ type: 'SET_ERROR', payload: 'Error message' });
dispatch({ type: 'CLEAR_STATE' });
```

## 🚀 Performance Optimization

### Built-in Optimizations

- **Automatic Token Refresh** - Background token renewal
- **Rate Limiting** - Prevents API abuse
- **Caching** - Local storage for tokens and settings
- **Lazy Loading** - Components load data on demand
- **Debouncing** - Search and filter debouncing
- **Pagination** - Efficient data loading

### Performance Tips

```tsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransformation(item));
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback((id) => {
  // Handle click
}, []);
```

## 📚 API Reference

### useXero Hook

```typescript
const {
  // State
  state,
  
  // Actions
  startAuth,           // Start OAuth flow
  handleCallback,      // Handle OAuth callback
  disconnect,          // Disconnect from Xero
  loadSettings,        // Load integration settings
  refreshConnection,   // Refresh connection status
  refreshToken,        // Refresh access token
  loadData,            // Load Xero data
  selectTenant,        // Select organization
  clearError,          // Clear error state
  saveSettings,        // Save integration settings
  deleteSettings,      // Delete integration settings
  
  // Utilities
  utils,               // Additional utility functions
} = useXero();
```

### Component Props

```typescript
// XeroConnect
interface XeroConnectProps {
  onSuccess?: (result: { tokens: XeroTokens; tenants: XeroTenant[] }) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

// XeroDashboard
interface XeroDashboardProps {
  tenantId?: string;
  showSummary?: boolean;
  showRecentData?: boolean;
  className?: string;
  onDataLoad?: (data: XeroDashboardData) => void;
}

// XeroDataTable
interface XeroDataTableProps<T = any> {
  resourceType: XeroResourceType;
  tenantId?: string;
  columns?: string[];
  pageSize?: number;
  showPagination?: boolean;
  showFilters?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  onDataLoad?: (data: T[]) => void;
}
```

## 🔧 Troubleshooting

### Common Issues

1. **OAuth Redirect Issues**
   - Ensure redirect URI matches exactly in Xero app settings
   - Check that backend handles OAuth callback properly
   - Verify CORS settings for your domain

2. **Token Expiration**
   - Enable `autoRefreshTokens` in config
   - Check that refresh token is stored securely
   - Verify token refresh endpoint is working

3. **Data Loading Issues**
   - Check that tenant is selected
   - Verify user has appropriate Xero permissions
   - Ensure backend API endpoints are working

4. **Rate Limiting**
   - Built-in rate limiting prevents API abuse
   - Wait between requests if rate limited
   - Consider implementing request queuing for high-volume apps

### Debug Mode

```tsx
// Enable debug logging
const config = {
  ...baseConfig,
  enableLogging: true, // Logs all API requests and responses
};
```

## 📄 License

This Xero integration package is part of your compliance management system and follows the same licensing terms.

## 🤝 Contributing

To contribute to this integration package:

1. Follow the existing code patterns
2. Add comprehensive TypeScript types
3. Include error handling for all operations
4. Test with both real and demo data
5. Update documentation for new features

## 📞 Support

For issues with this integration package:

1. Check the troubleshooting section
2. Review the error messages in browser console
3. Verify backend API endpoints are working
4. Check Xero app configuration
5. Ensure proper CORS settings

---

**Ready to integrate Xero into your application?** Start with the Quick Start guide above and customize the components to fit your needs!
