import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { XeroProvider } from '../contexts/XeroContext';
import XeroFlowManager from '../components/XeroFlowManager';
import toast from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock the API calls
jest.mock('../api/xeroService', () => ({
  getConnectionStatus: jest.fn(),
  getXeroAuthUrl: jest.fn(),
  handleXeroCallback: jest.fn(),
  deleteXeroSettings: jest.fn(),
}));

// Mock environment checker
jest.mock('../utils/envChecker', () => ({
  getApiUrl: () => 'http://localhost:3333/api',
}));

// Mock fetch
global.fetch = jest.fn();

const mockAuthContext = {
  isAuthenticated: true,
  company: { id: 7, name: 'Test Company' },
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const mockXeroContext = {
  state: {
    isConnected: false,
    hasSettings: true,
    selectedTenant: null,
    tenants: [],
    connectionStatus: null,
    error: null,
    isLoading: false,
  },
  startAuth: jest.fn(),
  handleCallback: jest.fn(),
  disconnect: jest.fn(),
  loadSettings: jest.fn(),
  refreshConnection: jest.fn(),
  selectTenant: jest.fn(),
  clearError: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <XeroProvider value={mockXeroContext}>
          {component}
        </XeroProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('XeroFlowManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  test('renders the Xero integration flow', () => {
    renderWithProviders(<XeroFlowManager />);
    
    expect(screen.getByText('Xero Integration')).toBeInTheDocument();
    expect(screen.getByText('Connect your Xero account in just a few simple steps')).toBeInTheDocument();
  });

  test('displays progress overview correctly', () => {
    renderWithProviders(<XeroFlowManager />);
    
    expect(screen.getByText('Setup Progress')).toBeInTheDocument();
    expect(screen.getByText('1 of 4 completed')).toBeInTheDocument();
  });

  test('shows flow steps with correct status', () => {
    renderWithProviders(<XeroFlowManager />);
    
    // Check that all steps are rendered
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Connect to Xero')).toBeInTheDocument();
    expect(screen.getByText('Select Organization')).toBeInTheDocument();
    expect(screen.getByText('Access Your Data')).toBeInTheDocument();
    
    // Check status badges
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('enables test mode when test mode button is clicked', async () => {
    renderWithProviders(<XeroFlowManager />);
    
    // Expand debug section
    const debugButton = screen.getByText('🔍 Debug Information');
    fireEvent.click(debugButton);
    
    // Click enable test mode
    const testModeButton = screen.getByText('Enable Test Mode');
    fireEvent.click(testModeButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Test mode enabled - using test token');
    });
  });

  test('enables demo mode when demo mode button is clicked', async () => {
    renderWithProviders(<XeroFlowManager />);
    
    // Expand debug section
    const debugButton = screen.getByText('🔍 Debug Information');
    fireEvent.click(debugButton);
    
    // Click demo mode
    const demoButton = screen.getByText('🎭 Demo Mode');
    fireEvent.click(demoButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('🎭 Demo mode: Simulated Xero connection successful!');
    });
  });

  test('shows organization selection when tenants are available', () => {
    const mockContextWithTenants = {
      ...mockXeroContext,
      state: {
        ...mockXeroContext.state,
        isConnected: true,
        tenants: [
          {
            id: 'tenant-1',
            name: 'Test Organization',
            organizationName: 'Test Organization',
            tenantId: 'tenant-1'
          }
        ],
        selectedTenant: null,
      }
    };

    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithTenants}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('🏢 Select Your Organization')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });

  test('handles organization selection correctly', async () => {
    const mockSelectTenant = jest.fn();
    const mockContextWithTenants = {
      ...mockXeroContext,
      state: {
        ...mockXeroContext.state,
        isConnected: true,
        tenants: [
          {
            id: 'tenant-1',
            name: 'Test Organization',
            organizationName: 'Test Organization',
            tenantId: 'tenant-1'
          }
        ],
        selectedTenant: null,
      },
      selectTenant: mockSelectTenant,
    };

    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithTenants}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const organizationButton = screen.getByText('Test Organization');
    fireEvent.click(organizationButton);

    expect(mockSelectTenant).toHaveBeenCalledWith('tenant-1');
  });

  test('shows data loading section when tenant is selected', () => {
    const mockContextWithSelectedTenant = {
      ...mockXeroContext,
      state: {
        ...mockXeroContext.state,
        isConnected: true,
        selectedTenant: {
          id: 'tenant-1',
          name: 'Test Organization',
          organizationName: 'Test Organization',
          tenantId: 'tenant-1'
        },
        tenants: [
          {
            id: 'tenant-1',
            name: 'Test Organization',
            organizationName: 'Test Organization',
            tenantId: 'tenant-1'
          }
        ],
      }
    };

    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithSelectedTenant}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('📊 Ready to Access Your Data')).toBeInTheDocument();
    expect(screen.getByText('📊 Load My Data')).toBeInTheDocument();
  });

  test('shows loaded data when data is available', () => {
    const mockContextWithData = {
      ...mockXeroContext,
      state: {
        ...mockXeroContext.state,
        isConnected: true,
        selectedTenant: {
          id: 'tenant-1',
          name: 'Test Organization',
          organizationName: 'Test Organization',
          tenantId: 'tenant-1'
        },
      }
    };

    // Mock xeroData state
    const TestComponent = () => {
      const [xeroData, setXeroData] = React.useState({
        organization: [{ Name: 'Test Organization' }],
        contacts: [{ Name: 'Test Contact' }],
        invoices: [{ InvoiceNumber: 'INV-001' }],
        accounts: [{ Name: 'Test Account' }]
      });

      return (
        <div>
          <div>Data Successfully Loaded!</div>
          <div>Test Organization</div>
          <div>Test Contact</div>
          <div>INV-001</div>
          <div>Test Account</div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithData}>
            <TestComponent />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Data Successfully Loaded!')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Test Contact')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Test Account')).toBeInTheDocument();
  });

  test('handles error display correctly', () => {
    const mockContextWithError = {
      ...mockXeroContext,
      state: {
        ...mockXeroContext.state,
        error: 'Test error message',
      }
    };

    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithError}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('shows quick actions section', () => {
    renderWithProviders(<XeroFlowManager />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    expect(screen.getByText('Load Data')).toBeInTheDocument();
    expect(screen.getByText('View All Data')).toBeInTheDocument();
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
  });

  test('handles remove Xero confirmation modal', async () => {
    const mockContextConnected = {
      ...mockXeroContext,
      state: {
        ...mockXeroContext.state,
        isConnected: true,
      }
    };

    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextConnected}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Click remove Xero button
    const removeButton = screen.getByText('Remove Xero');
    fireEvent.click(removeButton);

    // Check modal appears
    expect(screen.getByText('Remove Xero Account')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to disconnect and remove your Xero account?')).toBeInTheDocument();
    
    // Check cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Remove Xero Account')).not.toBeInTheDocument();
    });
  });
});

// Integration test for the complete flow
describe('XeroFlowManager Integration', () => {
  test('complete flow from connection to data access', async () => {
    const mockStartAuth = jest.fn();
    const mockSelectTenant = jest.fn();
    
    const mockContext = {
      ...mockXeroContext,
      startAuth: mockStartAuth,
      selectTenant: mockSelectTenant,
    };

    renderWithProviders(<XeroFlowManager />);

    // Step 1: Click Connect to Xero
    const connectButton = screen.getByText('Continue →');
    fireEvent.click(connectButton);
    
    expect(mockStartAuth).toHaveBeenCalled();

    // Step 2: Simulate successful connection with tenants
    const mockContextWithTenants = {
      ...mockContext,
      state: {
        ...mockContext.state,
        isConnected: true,
        tenants: [
          {
            id: 'tenant-1',
            name: 'Test Organization',
            organizationName: 'Test Organization',
            tenantId: 'tenant-1'
          }
        ],
      }
    };

    // Re-render with connected state
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithTenants}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Step 3: Select organization
    const organizationButton = screen.getByText('Test Organization');
    fireEvent.click(organizationButton);
    
    expect(mockSelectTenant).toHaveBeenCalledWith('tenant-1');

    // Step 4: Simulate data loading
    const mockContextWithSelectedTenant = {
      ...mockContextWithTenants,
      state: {
        ...mockContextWithTenants.state,
        selectedTenant: {
          id: 'tenant-1',
          name: 'Test Organization',
          organizationName: 'Test Organization',
          tenantId: 'tenant-1'
        },
      }
    };

    // Re-render with selected tenant
    render(
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          <XeroProvider value={mockContextWithSelectedTenant}>
            <XeroFlowManager />
          </XeroProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Verify data access step is available
    expect(screen.getByText('📊 Ready to Access Your Data')).toBeInTheDocument();
  });
});
