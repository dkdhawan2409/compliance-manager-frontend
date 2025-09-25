# Centralized Xero System - Usage Guide

## Overview

The Xero integration has been centralized using React Context, making it globally accessible from any component in the application. This eliminates the need for prop drilling and provides a consistent interface for all Xero operations.

## Architecture

### XeroProvider
- Wraps the entire application in `App.tsx`
- Manages global Xero state using React's useReducer
- Provides rate limiting and error handling
- Automatically loads settings on app startup

### useXero Hook
- Global hook that can be used in any component
- Provides access to all Xero state and actions
- Includes utility methods for common operations
- Offers computed properties for easier component logic

## Basic Usage

```tsx
import React from 'react';
import { useXero } from '../contexts/XeroContext';

const MyComponent: React.FC = () => {
  const { 
    isConnected, 
    hasSettings, 
    isLoading, 
    settings,
    selectedTenant,
    startAuth,
    disconnect,
    loadInvoices,
    statusText
  } = useXero();

  if (isLoading) return <div>Loading...</div>;
  
  if (!hasSettings) {
    return <div>Please configure Xero settings first</div>;
  }

  return (
    <div>
      <h2>Xero Status: {statusText}</h2>
      
      {isConnected ? (
        <div>
          <p>Connected to: {selectedTenant?.name}</p>
          <button onClick={() => loadInvoices()}>
            Load Invoices
          </button>
          <button onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={startAuth}>
          Connect to Xero
        </button>
      )}
    </div>
  );
};
```

## Available State Properties

### Core State
- `isConnected: boolean` - Whether Xero is connected
- `hasSettings: boolean` - Whether Xero settings are configured
- `isLoading: boolean` - Loading state for async operations
- `error: string | null` - Current error message
- `settings: XeroSettings | null` - Current Xero settings
- `tokens: XeroTokens | null` - OAuth tokens (if using OAuth)
- `tenants: XeroTenant[]` - Available Xero organizations
- `selectedTenant: XeroTenant | null` - Currently selected organization
- `connectionStatus: XeroConnectionStatus | null` - Detailed connection info

### Computed Properties
- `isReady: boolean` - Has settings and not loading
- `canConnect: boolean` - Can initiate connection
- `needsReconnect: boolean` - Needs to reconnect due to expired tokens
- `statusText: string` - Human-readable status
- `primaryTenant: XeroTenant` - First available tenant

## Available Actions

### Authentication & Connection
- `startAuth(): Promise<void>` - Start Xero authentication flow
- `handleCallback(code, state): Promise<void>` - Handle OAuth callback
- `disconnect(): Promise<void>` - Disconnect from Xero
- `refreshToken(): Promise<void>` - Refresh access token
- `refreshConnection(): Promise<void>` - Refresh connection status

### Settings Management
- `loadSettings(): Promise<void>` - Load settings from backend
- `saveSettings(settings): Promise<void>` - Save Xero settings
- `deleteSettings(): Promise<void>` - Delete Xero settings

### Data Loading
- `loadData(resourceType, tenantId?): Promise<any>` - Load any Xero data
- `loadInvoices(tenantId?): Promise<any>` - Load invoices
- `loadContacts(tenantId?): Promise<any>` - Load contacts
- `loadBankTransactions(tenantId?): Promise<any>` - Load bank transactions
- `loadAccounts(tenantId?): Promise<any>` - Load chart of accounts
- `loadItems(tenantId?): Promise<any>` - Load inventory items
- `loadOrganization(tenantId?): Promise<any>` - Load organization info
- `loadReports(tenantId?): Promise<any>` - Load reports

### Tenant Management
- `selectTenant(tenantId): void` - Select a different tenant

### Utility
- `clearError(): void` - Clear current error
- `getConnectionStatusText(): string` - Get status description

## Advanced Usage Examples

### Loading Multiple Data Types
```tsx
const { loadInvoices, loadContacts, loadAccounts, selectedTenant } = useXero();

const loadAllData = async () => {
  try {
    const [invoices, contacts, accounts] = await Promise.all([
      loadInvoices(),
      loadContacts(),
      loadAccounts()
    ]);
    
    console.log('All data loaded:', { invoices, contacts, accounts });
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};
```

### Multi-Tenant Operations
```tsx
const { tenants, loadData } = useXero();

const loadDataForAllTenants = async () => {
  const allInvoices = await Promise.all(
    tenants.map(tenant => loadData('invoices', tenant.id))
  );
  
  return allInvoices;
};
```

### Conditional Rendering Based on Status
```tsx
const { isConnected, hasSettings, isReady, needsReconnect } = useXero();

if (!hasSettings) {
  return <XeroSettingsForm />;
}

if (needsReconnect) {
  return <XeroReconnectPrompt />;
}

if (!isConnected) {
  return <XeroConnectionButton />;
}

if (isReady) {
  return <XeroDataDashboard />;
}

return <LoadingSpinner />;
```

## Benefits of Centralization

1. **Global Access**: Any component can access Xero functionality without prop drilling
2. **Consistent State**: Single source of truth for all Xero-related state
3. **Rate Limiting**: Built-in protection against API rate limits
4. **Error Handling**: Centralized error management with toast notifications
5. **Automatic Loading**: Settings and connection status loaded automatically
6. **Type Safety**: Full TypeScript support with proper type definitions
7. **Developer Experience**: Intuitive API with utility methods for common operations

## Migration from Old Hook

If you have components using the old `useXero` hook from `../hooks/useXero`, simply change the import:

```tsx
// Old
import { useXero } from '../hooks/useXero';

// New
import { useXero } from '../contexts/XeroContext';
```

The API remains the same, but you now get access to the centralized state and additional utility methods.

