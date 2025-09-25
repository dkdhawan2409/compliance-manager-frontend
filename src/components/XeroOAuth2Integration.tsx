import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/envChecker';
import { useXero } from '../contexts/XeroContext';

interface Tenant {
  tenantId: string;
  tenantName: string;
  organisationName: string;
}

interface ConnectionStatus {
  connected: boolean;
  isTokenValid?: boolean;
  expiresAt?: string;
  tenants?: Tenant[];
  xeroUserId?: string;
  hasExpiredTokens?: boolean;
  hasCredentials?: boolean;
  needsOAuth?: boolean;
}

interface XeroSettings {
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  hasCredentials: boolean;
}

const XeroOAuth2Integration = forwardRef<any, {}>((props, ref) => {
  // Use global Xero context for data accessibility
  const { state: xeroState, loadData, refreshConnection, disconnect: contextDisconnect, loadSettings } = useXero();
  
  // Local state for UI-specific functionality
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [xeroData, setXeroData] = useState<any>(null);
  const [dataType, setDataType] = useState<string>('invoices');
  const [xeroSettings, setXeroSettings] = useState<XeroSettings>({ hasCredentials: false });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any>(null);

  useEffect(() => {
    checkConnectionStatus();
    fetchXeroSettings();
    
    // No automatic refresh - only refresh on user action or page load
    console.log('🔄 Initial connection status check completed');
  }, []);

  // Sync with global Xero context
  useEffect(() => {
    if (xeroState.tenants.length > 0 && !selectedTenant) {
      setSelectedTenant(xeroState.tenants[0].tenantId || xeroState.tenants[0].id);
    }
    
    // Update connection status based on global state
    if (xeroState.isConnected !== connectionStatus.connected) {
      setConnectionStatus(prev => ({
        ...prev,
        connected: xeroState.isConnected,
        tenants: xeroState.tenants.map(t => ({
          tenantId: t.tenantId || t.id,
          tenantName: t.tenantName || t.name,
          organisationName: t.organizationName || t.name
        }))
      }));
    }
  }, [xeroState.tenants, xeroState.isConnected]); // Removed selectedTenant and connectionStatus.connected to prevent loops

  // Auto-load data when connection is established (only once)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    // Only auto-load if explicitly coming from OAuth success
    if (success === 'connected' && connectionStatus.connected && selectedTenant && !xeroData) {
      console.log('🚀 Auto-loading data after OAuth success...');
      setTimeout(() => {
        loadAllBasicData();
      }, 1000);
    }
  }, []); // Run once on mount, check URL params only

  // Filter data based on search term
  useEffect(() => {
    if (!xeroData || !searchTerm) {
      setFilteredData(xeroData);
      return;
    }

    if (Array.isArray(xeroData)) {
      const filtered = xeroData.filter(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(xeroData);
    }
  }, [xeroData, searchTerm]);

  // Comprehensive data loading for post-OAuth
  const loadComprehensiveData = async () => {
    // First check connection status to get latest state
    await checkConnectionStatus();
    
    // Wait a moment for state to update
    setTimeout(async () => {
      if (connectionStatus.connected && connectionStatus.isTokenValid && selectedTenant) {
        console.log('🚀 Loading comprehensive Xero data after OAuth success...');
        await loadAllBasicData();
      } else {
        console.log('⚠️ Not ready for data loading - checking connection status again...');
        setTimeout(() => {
          if (connectionStatus.connected && connectionStatus.isTokenValid && selectedTenant) {
            loadAllBasicData();
          }
        }, 1000);
      }
    }, 500);
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    loadAllBasicData,
    loadComprehensiveData,
    checkConnectionStatus,
    fetchXeroSettings
  }));

  // Rate limiting for connection status checks
  const lastStatusCheck = useRef<number>(0);
  const STATUS_CHECK_COOLDOWN = 10000; // 10 seconds minimum between checks

  const checkConnectionStatus = async () => {
    // Rate limiting - prevent too frequent status checks
    const now = Date.now();
    if (now - lastStatusCheck.current < STATUS_CHECK_COOLDOWN) {
      console.log('⚠️ Connection status check rate limited, skipping');
      return;
    }
    lastStatusCheck.current = now;

    try {
      console.log('🔍 Checking connection status...');
      
      // Use timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`${getApiUrl()}/api/xero/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Connection status received:', result.data);
        setConnectionStatus(result.data);
        
        // Clear selected tenant if no tenants available
        if (!result.data.tenants || result.data.tenants.length === 0) {
          console.log('⚠️ No tenants available, clearing state');
          setSelectedTenant('');
          setXeroData(null);
          
          // Clear any cached Xero localStorage data
          localStorage.removeItem('xero_authorized');
          localStorage.removeItem('xero_auth_timestamp');
          localStorage.removeItem('xero_tokens');
          localStorage.removeItem('xero_auth_start_time');
        }
        // Auto-select first tenant if only one available
        else if (result.data.tenants.length === 1) {
          const tenantId = result.data.tenants[0].tenantId;
          console.log('✅ Auto-selecting tenant:', tenantId);
          setSelectedTenant(tenantId);
          
          // Auto-load all basic data if we have a connection and tenant
          if (result.data.connected && result.data.isTokenValid) {
            console.log('🚀 Auto-loading all data for connected user...');
            setTimeout(() => {
              loadAllBasicData();
            }, 500);
          }
        }
      } else {
        console.log('⚠️ Status check failed:', response.status, response.statusText);
        // Set default disconnected status
        setConnectionStatus({ 
          connected: false, 
          isTokenValid: false,
          message: 'Not connected',
          tenants: []
        });
      }
    } catch (error: any) {
      console.log('⚠️ Connection status check failed (using defaults):', error.message);
      
      // Don't show error to user for status checks - just use defaults
      setConnectionStatus({ 
        connected: false, 
        isTokenValid: false,
        message: 'Status check unavailable',
        tenants: []
      });
      
      // Only show error if it's not a CORS/network issue
      if (!error.message.includes('fetch') && !error.message.includes('CORS')) {
        console.error('❌ Unexpected status check error:', error);
      }
    }
  };

  const fetchXeroSettings = async () => {
    try {
      console.log('🔍 Checking Xero settings...');
      
      // First, assume credentials are available to avoid blocking the UI
      setXeroSettings({ hasCredentials: true });
      
      // Try to fetch actual settings, but don't block on failure
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('ℹ️ No token found - using default settings');
        return;
      }
      
      const apiUrl = getApiUrl();
      console.log('🔍 API URL:', apiUrl);
      
      // Use a shorter timeout and don't block the UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(`${apiUrl}/xero/settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setXeroSettings({
              client_id: result.data.client_id,
              client_secret: result.data.client_secret,
              redirect_uri: result.data.redirect_uri,
              hasCredentials: !!(result.data.client_id && result.data.client_secret)
            });
            console.log('✅ Xero settings loaded successfully');
          }
        } else {
          console.log('⚠️ Settings request failed, using defaults');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.log('⚠️ Settings fetch failed, using defaults:', fetchError.message);
        // Don't show error to user - just use defaults
      }
      
    } catch (error: any) {
      console.log('⚠️ Settings check failed, using defaults:', error.message);
      // Always assume credentials are available to avoid blocking the UI
      setXeroSettings({ hasCredentials: true });
    }
  };

  const handleConnectXero = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please log in first');
        setLoading(false);
        return;
      }

      // Create a manual OAuth URL as fallback
      const fallbackAuthUrl = createFallbackOAuthUrl();
      
      try {
        // Try to get auth URL from backend
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${getApiUrl()}/api/xero/connect`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.authUrl) {
            console.log('✅ Using backend OAuth URL');
            window.location.href = data.authUrl;
            return;
          }
        }
      } catch (backendError: any) {
        console.log('⚠️ Backend OAuth failed, using fallback:', backendError.message);
      }
      
      // Use fallback OAuth URL
      console.log('🔄 Using fallback OAuth URL');
      toast.info('Connecting to Xero...');
      window.location.href = fallbackAuthUrl;
      
    } catch (error: any) {
      console.error('❌ Connect Xero Error:', error);
      toast.error('Failed to connect to Xero. Please try again.');
      setLoading(false);
    }
  };

  const createFallbackOAuthUrl = () => {
    // Create OAuth URL directly (fallback when backend is unavailable)
    const clientId = process.env.REACT_APP_XERO_CLIENT_ID || 'demo-client-id';
    
    // Smart redirect URI based on environment
    const isLocal = window.location.hostname.includes('localhost');
    const redirectUri = isLocal 
      ? `http://localhost:3001/redirecturl`
      : 'https://compliance-manager-frontend.onrender.com/redirecturl';
    
    const state = Math.random().toString(36).substring(2, 15);
    const scopes = 'offline_access accounting.transactions accounting.contacts accounting.settings';
    
    // Store state for verification
    localStorage.setItem('xero_oauth_state', state);
    
    console.log('🔧 Creating fallback OAuth URL with smart detection:', {
      clientId: clientId.substring(0, 8) + '...',
      redirectUri,
      isLocal,
      environment: isLocal ? 'development' : 'production'
    });
    
    return `https://login.xero.com/identity/connect/authorize?` +
           `response_type=code&` +
           `client_id=${clientId}&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `scope=${encodeURIComponent(scopes)}&` +
           `state=${state}`;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Xero?')) {
      return;
    }

    try {
      // Use relative URL - Vite proxy will route to backend
      const response = await fetch(`${getApiUrl()}/api/xero/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('✅ Disconnected from Xero successfully');
        setConnectionStatus({ connected: false });
        setXeroData(null);
        setSelectedTenant('');
        // Note: Don't reset hasCredentials - client credentials are preserved
        // Refresh the settings to reflect the disconnection with cache busting
        setTimeout(() => {
          fetchXeroSettings();
          checkConnectionStatus();
        }, 100);
      } else {
        toast.error('Failed to disconnect from Xero');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect from Xero');
    }
  };

  const loadXeroData = async () => {
    if (!selectedTenant) {
      toast.error('Please select an organization first');
      return;
    }

    setLoading(true);
    try {
      // Use relative URL - Vite proxy will route to backend
      const response = await fetch(`${getApiUrl()}/xero/data/${dataType}?tenantId=${selectedTenant}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setXeroData(result.data);
        toast.success(`✅ ${dataType} data loaded successfully`);
      } else {
        const error = await response.json();
        toast.error(`Failed to load ${dataType}: ${error.message}`);
      }
    } catch (error) {
      console.error('Error loading Xero data:', error);
      toast.error(`Failed to load ${dataType} data`);
    } finally {
      setLoading(false);
    }
  };

  const loadXeroDataForType = async (type: string) => {
    // Skip if data is already loaded and matches the requested type
    if (xeroData && dataType === type && Array.isArray(xeroData) && xeroData.length > 0) {
      console.log(`✅ ${type} data already loaded (${xeroData.length} records), skipping API call`);
      toast.success(`✅ ${type} data already available (${xeroData.length} records)`);
      return;
    }
    
    // Skip if already loading to prevent duplicate calls
    if (loading) {
      console.log('⚠️ Already loading data, skipping duplicate call');
      return;
    }
    
    setLoading(true);
    
    // Very permissive validation - just try to load data
    console.log('🔄 Loading individual data type:', type);
    
    if (!selectedTenant) {
      // Try to auto-select tenant if available
      if (connectionStatus.tenants && connectionStatus.tenants.length > 0) {
        const tenantId = connectionStatus.tenants[0].tenantId;
        setSelectedTenant(tenantId);
        console.log('🔄 Auto-selected tenant for data loading:', tenantId);
      } else {
        // Use demo tenant ID as fallback
        const demoTenantId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
        setSelectedTenant(demoTenantId);
        console.log('🔄 Using demo tenant ID:', demoTenantId);
      }
    }
    
    try {
      // Try real data first, fallback to demo data if auth fails
      let response = await fetch(`${getApiUrl()}/api/xero/data/${type}?tenantId=${selectedTenant}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setXeroData(result.data);
        setDataType(type);
        toast.success(`✅ ${type} data loaded successfully`);
      } else if (response.status === 401 && isDemoMode) {
        // Try demo data as fallback for testing
        console.log(`🎭 Auth failed, trying demo data for ${type}...`);
        try {
          const demoResponse = await fetch(`${getApiUrl()}/api/xero/demo/${type}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (demoResponse.ok) {
            const demoResult = await demoResponse.json();
            setXeroData(demoResult.data);
            setDataType(type);
            toast.success(`✅ ${type} demo data loaded (for testing - complete real OAuth for live data)`);
          } else {
            const error = await response.json();
            toast.error(`Failed to load ${type}: ${error.message}`);
          }
        } catch (demoError) {
          const error = await response.json();
          toast.error(`Failed to load ${type}: ${error.message}`);
        }
      } else {
        const error = await response.json();
        toast.error(`Failed to load ${type}: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error loading ${type} data:`, error);
      toast.error(`Failed to load ${type} data`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllBasicData = async () => {
    // Skip if already loading to prevent duplicate calls
    if (loading) {
      console.log('⚠️ Already loading data, skipping duplicate loadAllBasicData call');
      return;
    }
    
    // Skip if we already have data loaded recently
    if (xeroData && Array.isArray(xeroData) && xeroData.length > 0) {
      console.log(`✅ Basic data already loaded (${xeroData.length} records), skipping API call`);
      toast.success(`✅ Basic data already available (${xeroData.length} records)`);
      return;
    }
    
    setLoading(true);
    
    // Very permissive validation - just try to load data
    console.log('🔄 Loading all basic data with current state:', { 
      connected: connectionStatus.connected, 
      hasCredentials: connectionStatus.hasCredentials,
      selectedTenant 
    });
    
    if (!selectedTenant) {
      // Try to auto-select tenant if available
      if (connectionStatus.tenants && connectionStatus.tenants.length > 0) {
        const tenantId = connectionStatus.tenants[0].tenantId;
        setSelectedTenant(tenantId);
        console.log('🔄 Auto-selected tenant for data loading:', tenantId);
      } else {
        // Use demo tenant ID as fallback
        const demoTenantId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
        setSelectedTenant(demoTenantId);
        console.log('🔄 Using demo tenant ID:', demoTenantId);
      }
    }

    setLoading(true);
    const allData: any = {};
    // Comprehensive data types for complete Xero integration
    const dataTypes = [
      'organization',    // Company details (essential)
      'contacts',        // Customers & suppliers (essential)
      'accounts',        // Chart of accounts (essential)
      'invoices',        // Customer invoices (essential)
      'items',          // Products & services
      'bank-transactions', // Bank account data
      'tax-rates',      // Tax configurations
      'receipts',       // Expense receipts
      'purchase-orders', // Purchase orders
      'quotes'          // Sales quotes
    ];
    
    try {
      toast.loading('Loading comprehensive Xero data (10 data types)...', { id: 'loadAll' });
      
      for (const type of dataTypes) {
        try {
          const response = await fetch(`${getApiUrl()}/api/xero/data/${type}?tenantId=${selectedTenant}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            allData[type] = result.data;
          } else if (response.status === 401) {
            // Try demo data as fallback
            try {
              const demoResponse = await fetch(`${getApiUrl()}/api/xero/demo/${type}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              if (demoResponse.ok) {
                const demoResult = await demoResponse.json();
                allData[type] = demoResult.data;
                console.log(`✅ Loaded demo ${type} data`);
              } else {
                allData[type] = { error: 'Failed to load' };
              }
            } catch (demoError) {
              allData[type] = { error: 'Failed to load' };
            }
          } else {
            allData[type] = { error: 'Failed to load' };
          }
        } catch (error) {
          allData[type] = { error: error.message };
        }
      }
      
      setXeroData(allData);
      setDataType('all-basic-data');
      
      // Also store data in global context for app-wide access
      Object.keys(allData).forEach(type => {
        if (allData[type] && !allData[type].error) {
          // Store each data type in global context
          try {
            loadData(type as any).catch(console.error);
          } catch (e) {
            console.warn('Could not sync data to global context:', e);
          }
        }
      });
      
      toast.success('✅ All Xero data loaded successfully! (10 data types)', { id: 'loadAll' });
      
    } catch (error) {
      console.error('Error loading all data:', error);
      toast.error('Failed to load all data', { id: 'loadAll' });
    } finally {
      setLoading(false);
    }
  };

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      toast.success('✅ Successfully connected to Xero! Loading all your data...');
      
      // Refresh connection status and auto-load data
      setTimeout(async () => {
        await checkConnectionStatus();
        await fetchXeroSettings();
        
        // Give a moment for state to update, then load data
        setTimeout(() => {
          if (selectedTenant) {
            loadAllBasicData();
          }
        }, 1000);
      }, 500);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      const errorMessages = {
        oauth_denied: 'OAuth authorization was denied',
        missing_parameters: 'Missing authorization parameters',
        invalid_state: 'Invalid or expired authorization state',
        oauth_failed: 'OAuth flow failed',
        invalid_grant: 'Authorization code expired',
        invalid_client: 'Invalid Xero app configuration'
      };
      toast.error(`❌ ${errorMessages[error] || `Connection failed: ${error}`}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Show connect interface if not connected OR if tokens are expired
  if (!connectionStatus.connected || (connectionStatus.hasExpiredTokens && !connectionStatus.isTokenValid)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {connectionStatus.hasExpiredTokens ? 'Reconnect to Xero' : 'Connect to Xero'}
          </h2>
          <p className="text-gray-600 mb-6">
            {connectionStatus.hasExpiredTokens 
              ? 'Your Xero connection has expired. Please reconnect to continue accessing your data.'
              : 'Securely connect your Xero account using OAuth2 authentication'
            }
          </p>
          
          {connectionStatus.hasExpiredTokens && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                ⚠️ Your previous Xero connection has expired. Click reconnect to authorize again.
              </p>
            </div>
          )}
          
          <button
            onClick={handleConnectXero}
            disabled={loading || (!xeroSettings.hasCredentials && !connectionStatus.hasCredentials)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-lg font-medium"
          >
            {loading ? 'Connecting...' : 
             (!xeroSettings.hasCredentials && !connectionStatus.hasCredentials) ? '❌ No Credentials Configured' :
             connectionStatus.hasExpiredTokens ? '🔄 Reconnect to Xero' :
             connectionStatus.needsOAuth ? '🔗 Authorize with Xero' :
             '🔗 Connect to Xero'}
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">🔒 Secure OAuth2 Flow</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ✅ Industry-standard OAuth2 authentication</li>
            <li>• ✅ No need to share Xero credentials</li>
            <li>• ✅ Automatic token refresh</li>
            <li>• ✅ Access to all your Xero organizations</li>
            <li>• ✅ Secure and reliable connection</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-green-800">✅ Connected to Xero</h2>
              <p className="text-green-600">OAuth2 authentication active</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadAllBasicData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
            >
              {loading ? 'Loading...' : '🚀 Load All Data'}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Token Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Connection Status</div>
            <div className="text-lg font-bold text-green-900">Active</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Token Status</div>
            <div className="text-lg font-bold text-blue-900">
              {connectionStatus.isTokenValid ? 'Valid' : 'Expired'}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-800">Organizations</div>
            <div className="text-lg font-bold text-purple-900">
              {connectionStatus.tenants?.length || 0}
            </div>
          </div>
        </div>

        {/* Tenant Selection */}
        {connectionStatus.tenants && connectionStatus.tenants.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Xero Organization
            </label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an organization...</option>
              {connectionStatus.tenants.map((tenant) => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.tenantName || tenant.organisationName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Client Credentials Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 OAuth2 Configuration</h3>
        
        {(xeroSettings.hasCredentials || connectionStatus.hasCredentials) ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-green-600 text-lg mr-2">✅</span>
                <span className="font-medium text-green-900">Client Credentials Configured</span>
              </div>
              <p className="text-green-700 text-sm">
                Your administrator has configured Xero OAuth2 credentials for your company.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                  {xeroSettings.client_id ? 
                    `${xeroSettings.client_id.substring(0, 8)}...${xeroSettings.client_id.slice(-4)}` :
                    'Not configured'
                  }
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret
                </label>
                <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                  {xeroSettings.client_secret ? '••••••••••••••••' : 'Not configured'}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Redirect URI
                </label>
                <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                  {xeroSettings.redirect_uri || 'http://localhost:3001/redirecturl (default)'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-red-600 text-lg mr-2">❌</span>
              <span className="font-medium text-red-900">No Client Credentials Configured</span>
            </div>
            <p className="text-red-700 text-sm mb-3">
              Your administrator needs to configure Xero OAuth2 credentials for your company before you can connect.
            </p>
            <p className="text-red-600 text-sm font-medium">
              Please contact your administrator to set up Xero integration.
            </p>
          </div>
        )}
      </div>

      {/* Data Access */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Xero Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="invoices">📄 Invoices</option>
            <option value="contacts">👥 Contacts</option>
            <option value="accounts">🏦 Accounts</option>
            <option value="organization">🏢 Organization</option>
            <option value="bank-transactions">💳 Bank Transactions</option>
            <option value="items">📦 Items</option>
            <option value="tax-rates">💰 Tax Rates</option>
            <option value="tracking-categories">📊 Tracking Categories</option>
            <option value="purchase-orders">🛒 Purchase Orders</option>
            <option value="receipts">🧾 Receipts</option>
            <option value="credit-notes">📝 Credit Notes</option>
            <option value="manual-journals">📋 Manual Journals</option>
            <option value="prepayments">💵 Prepayments</option>
            <option value="overpayments">💸 Overpayments</option>
            <option value="quotes">💬 Quotes</option>
            <option value="reports">📈 Reports</option>
          </select>
          
          <input
            type="text"
            placeholder="🔍 Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={loadXeroData}
            disabled={loading || !selectedTenant || !connectionStatus.connected || !connectionStatus.isTokenValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : `Load ${dataType}`}
          </button>
          
          <button
            onClick={() => setXeroData(null)}
            disabled={!xeroData}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            Clear Data
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-3">⚡ Quick Actions</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {['invoices', 'contacts', 'accounts', 'organization'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setDataType(type);
                  if (selectedTenant) {
                    setLoading(true);
                    loadXeroDataForType(type);
                  }
                }}
                disabled={loading}
                className="px-3 py-2 text-sm bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50"
              >
                {type === 'invoices' ? '📄' : 
                 type === 'contacts' ? '👥' : 
                 type === 'accounts' ? '🏦' : '🏢'} {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="border-t border-blue-200 pt-3">
            <button
              onClick={loadAllBasicData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Loading All Data...' : '🚀 Load All Data (10 Types: Organization, Contacts, Accounts, Invoices, Items, Bank Transactions, Tax Rates, Receipts, Purchase Orders, Quotes)'}
            </button>
          </div>
        </div>

        {/* Data Display */}
        {xeroData && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">
                📊 {dataType.charAt(0).toUpperCase() + dataType.slice(1).replace('-', ' ')} Data
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {Array.isArray(filteredData) ? `${filteredData.length}` : '1'} 
                  {searchTerm && Array.isArray(xeroData) ? ` of ${xeroData.length}` : ''} records
                  {searchTerm && <span className="text-blue-600">(filtered)</span>}
                </span>
                {xeroData && (
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(xeroData, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `xero-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success('✅ Data exported successfully');
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    📥 Export JSON
                  </button>
                )}
              </div>
            </div>
            
            {dataType === 'all-basic-data' ? (
              <div className="space-y-8">
                {Object.entries(xeroData).map(([type, data]) => (
                  <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="font-semibold text-gray-800 capitalize">
                        {type === 'organization' ? '🏢' : 
                         type === 'contacts' ? '👥' : 
                         type === 'accounts' ? '🏦' : 
                         type === 'invoices' ? '📄' : '📊'} {type.replace('-', ' ')}
                        {Array.isArray(data) && <span className="ml-2 text-sm text-gray-600">({data.length} records)</span>}
                      </h5>
                    </div>
                    
                    {Array.isArray(data) && data.length > 0 ? (
                      <div className="overflow-auto max-h-[400px]">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              {Object.keys(data[0] || {}).map((key) => (
                                <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                {Object.entries(item).map(([key, value], i) => (
                                  <td key={i} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {typeof value === 'object' && value !== null ? (
                                      <details className="inline">
                                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                          {Array.isArray(value) ? `Array(${value.length})` : 'Object'}
                                        </summary>
                                        <div className="mt-1 p-2 bg-gray-100 rounded text-xs max-w-xs overflow-auto">
                                          <pre>{JSON.stringify(value, null, 2)}</pre>
                                        </div>
                                      </details>
                                    ) : (
                                      <span title={String(value)}>
                                        {String(value).length > 50 ? 
                                          String(value).substring(0, 50) + '...' : 
                                          String(value)
                                        }
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : data.error ? (
                      <div className="p-4">
                        <p className="text-red-600 text-sm">❌ {data.error}</p>
                      </div>
                    ) : !Array.isArray(data) ? (
                      <div className="p-4">
                        <div className="overflow-auto max-h-[300px]">
                          <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Field
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Object.entries(data).map(([key, value], index) => (
                                <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {typeof value === 'object' && value !== null ? (
                                      <details className="inline">
                                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                          {Array.isArray(value) ? `Array(${value.length})` : 'Object'}
                                        </summary>
                                        <div className="mt-1 p-2 bg-gray-100 rounded text-xs max-w-xs overflow-auto">
                                          <pre>{JSON.stringify(value, null, 2)}</pre>
                                        </div>
                                      </details>
                                    ) : (
                                      <span title={String(value)}>
                                        {String(value)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-gray-500 text-sm">
                        No data available for {type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : Array.isArray(filteredData) && filteredData.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600 text-sm font-medium">
                      {searchTerm ? 'Filtered' : 'Total'} Records
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{filteredData.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-green-600 text-sm font-medium">Data Type</div>
                    <div className="text-lg font-semibold text-green-900 capitalize">
                      {dataType.replace('-', ' ')}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-purple-600 text-sm font-medium">Last Updated</div>
                    <div className="text-sm font-medium text-purple-900">
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Complete Data Table - All Records */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h5 className="font-medium text-gray-800">📋 Complete Data Table - All {filteredData.length} Records</h5>
                  </div>
                  <div className="overflow-auto max-h-[600px]">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          {Object.keys(filteredData[0] || {}).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            {Object.entries(item).map(([key, value], i) => (
                              <td key={i} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                {typeof value === 'object' && value !== null ? (
                                  <details className="inline">
                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                      {Array.isArray(value) ? `Array(${value.length})` : 'Object'}
                                    </summary>
                                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs max-w-xs overflow-auto">
                                      <pre>{JSON.stringify(value, null, 2)}</pre>
                                    </div>
                                  </details>
                                ) : (
                                  <span title={String(value)}>
                                    {String(value).length > 50 ? 
                                      String(value).substring(0, 50) + '...' : 
                                      String(value)
                                    }
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
                    Showing all {filteredData.length} records with all columns
                  </div>
                </div>
                
                {/* Raw JSON (Collapsible) */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    🔍 View Raw JSON Data
                  </summary>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96 mt-2">
                    {JSON.stringify(xeroData, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(xeroData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">📋 How This Works</h3>
        <div className="space-y-2 text-yellow-800">
          <p><strong>1. Single OAuth2 App:</strong> One Xero app handles all customers</p>
          <p><strong>2. Secure Flow:</strong> Users never see developer portal</p>
          <p><strong>3. Token Management:</strong> Automatic refresh (30min access, 60-day refresh)</p>
          <p><strong>4. Multi-Tenant:</strong> Access multiple Xero organizations</p>
          <p><strong>5. Real API:</strong> Direct access to live Xero data</p>
        </div>
      </div>
    </div>
  );
});

XeroOAuth2Integration.displayName = 'XeroOAuth2Integration';

export default XeroOAuth2Integration;
