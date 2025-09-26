import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useXero } from '../contexts/XeroContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid, 
  Box, 
  Alert, 
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CloudSync,
  AccountBalance,
  Receipt,
  People,
  Assessment,
  Settings,
  Refresh,
  Download,
  Visibility,
  CheckCircle,
  Error as ErrorIcon,
  Warning
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`xero-tabpanel-${index}`}
      aria-labelledby={`xero-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedXeroFlow: React.FC = () => {
  const { state, startAuth, handleCallback, disconnect, loadSettings, refreshConnection, selectTenant, clearError, loadData } = useXero();
  const { isAuthenticated } = useAuth();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loadedData, setLoadedData] = useState<{[key: string]: any}>({});
  const [dataLoadingStates, setDataLoadingStates] = useState<{[key: string]: boolean}>({});

  const { isConnected, hasSettings, selectedTenant, tenants, connectionStatus, error, isLoading } = state;

  // Auto-select first tenant if only one is available
  useEffect(() => {
    if (tenants && tenants.length === 1 && !selectedTenant) {
      console.log('🎯 Auto-selecting single tenant:', tenants[0].name);
      selectTenant(tenants[0].id);
    }
  }, [tenants, selectedTenant, selectTenant]);

  // Refresh connection status when component mounts
  useEffect(() => {
    const refreshOnMount = async () => {
      try {
        console.log('🔄 Refreshing Xero connection status...');
        await loadSettings();
        await refreshConnection();
      } catch (error) {
        console.log('⚠️ Failed to refresh connection status:', error);
      }
    };

    refreshOnMount();
  }, [loadSettings, refreshConnection]);

  const handleOneClickConnect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      console.log('🚀 Starting one-click Xero connection...');
      await startAuth();
    } catch (error: any) {
      console.error('❌ OAuth flow error:', error);
      toast.error(error.message || 'Failed to start Xero connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadSpecificData = async (dataType: string) => {
    if (!selectedTenant) {
      toast.error('Please select a tenant first');
      return;
    }

    setDataLoadingStates(prev => ({ ...prev, [dataType]: true }));
    
    try {
      console.log(`📊 Loading ${dataType} data...`);
      const result = await loadData(dataType);
      
      if (result.success) {
        setLoadedData(prev => ({ ...prev, [dataType]: result.data }));
        // Only show success toast for individual loads, not for bulk
        if (!isLoadingData) {
          toast.success(`${dataType} data loaded successfully!`);
        }
      } else {
        toast.error(`Failed to load ${dataType}: ${result.message}`);
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${dataType}:`, error);
      toast.error(`Failed to load ${dataType}: ${error.message}`);
    } finally {
      setDataLoadingStates(prev => ({ ...prev, [dataType]: false }));
    }
  };

  const loadAllData = async () => {
    if (!selectedTenant) {
      toast.error('Please select a tenant first');
      return;
    }

    setIsLoadingData(true);
    
    try {
      console.log('📊 Loading all Xero data...');
      
      const dataTypes = [
        'organization',
        'contacts', 
        'invoices',
        'accounts',
        'bank-transactions',
        'items',
        'tax-rates',
        'tracking-categories',
        'purchase-orders',
        'receipts',
        'credit-notes',
        'manual-journals',
        'prepayments',
        'overpayments',
        'quotes'
      ];

      // Load data sequentially to avoid rate limiting
      for (const type of dataTypes) {
        try {
          console.log(`📊 Loading ${type}...`);
          const result = await loadData(type);
          if (result.success) {
            setLoadedData(prev => ({ ...prev, [type]: result.data }));
          }
          // Add small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`⚠️ Failed to load ${type}:`, error);
        }
      }

      toast.success('🎉 All Xero data loaded successfully!');
      
    } catch (error: any) {
      console.error('❌ Error loading all data:', error);
      toast.error('Failed to load some data, but partial data is available');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getDataCount = (dataType: string) => {
    const data = loadedData[dataType];
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object') return Object.keys(data).length;
    return 0;
  };

  const renderDataTable = (dataType: string, data: any) => {
    if (!data) return <Typography color="text.secondary">No data loaded</Typography>;
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <Typography color="text.secondary">No {dataType} data available</Typography>;
      }

      // Get the first item to determine table structure
      const firstItem = data[0];
      const columns = Object.keys(firstItem);
      
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            {dataType.charAt(0).toUpperCase() + dataType.slice(1)} ({data.length} items)
          </Typography>
          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                  {columns.map((column) => (
                    <th 
                      key={column}
                      style={{ 
                        padding: '12px 8px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((item: any, index: number) => (
                  <tr 
                    key={index} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    {columns.map((column) => (
                      <td 
                        key={column}
                        style={{ 
                          padding: '10px 8px', 
                          borderBottom: '1px solid #eee',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={typeof item[column] === 'object' ? JSON.stringify(item[column]) : String(item[column] || '')}
                      >
                        {renderCellValue(item[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 50 && (
              <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Showing first 50 of {data.length} items
              </Typography>
            )}
          </Box>
        </Box>
      );
    }
    
    // For non-array data, show as key-value pairs
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
        </Typography>
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                  Property
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value], index) => (
                <tr 
                  key={key} 
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td 
                    style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #eee',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                  >
                    {renderCellValue(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>
    );
  };

  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>—</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Chip 
          label={value ? 'Yes' : 'No'} 
          size="small" 
          color={value ? 'success' : 'default'}
          variant="outlined"
        />
      );
    }
    
    if (typeof value === 'number') {
      return <span style={{ fontFamily: 'monospace' }}>{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      if (value.length > 50) {
        return (
          <span title={value}>
            {value.substring(0, 50)}...
          </span>
        );
      }
      return value;
    }
    
    if (Array.isArray(value)) {
      return (
        <Chip 
          label={`${value.length} items`} 
          size="small" 
          color="info"
          variant="outlined"
        />
      );
    }
    
    if (typeof value === 'object') {
      return (
        <Chip 
          label="Object" 
          size="small" 
          color="secondary"
          variant="outlined"
        />
      );
    }
    
    return String(value);
  };

  if (!isAuthenticated) {
    return (
      <SidebarLayout>
        <Alert severity="error">Please log in to access Xero integration</Alert>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            🚀 Xero Flow - Complete Data Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive Xero integration with full data access and management
          </Typography>
        </Box>

        {/* Connection Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Connection Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isConnected ? (
                  <Chip icon={<CheckCircle />} label="Connected" color="success" />
                ) : (
                  <Chip icon={<ErrorIcon />} label="Not Connected" color="error" />
                )}
                {isLoading && <CircularProgress size={20} />}
              </Box>
            </Box>

            {!hasSettings && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠️ Xero Client ID is not configured. Please ask your administrator to configure Xero client credentials.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!isConnected ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudSync />}
                  onClick={handleOneClickConnect}
                  disabled={isConnecting || !hasSettings}
                  size="large"
                >
                  {isConnecting ? 'Connecting...' : 'Connect to Xero'}
                </Button>
                {!hasSettings && (
                  <Typography variant="body2" color="text.secondary">
                    Contact your administrator to configure Xero credentials
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={refreshConnection}
                  disabled={isLoading}
                >
                  Refresh Connection
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ErrorIcon />}
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Tenant Selection */}
        {isConnected && tenants && tenants.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Organization Selection
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {tenants.map((tenant) => (
                  <Chip
                    key={tenant.id}
                    label={tenant.name}
                    onClick={() => selectTenant(tenant.id)}
                    color={selectedTenant?.id === tenant.id ? 'primary' : 'default'}
                    variant={selectedTenant?.id === tenant.id ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Data Management */}
        {isConnected && selectedTenant && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Data Management</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={loadAllData}
                    disabled={isLoadingData}
                    size="small"
                  >
                    {isLoadingData ? 'Loading...' : 'Load All Data'}
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {[
                  { type: 'organization', label: 'Organization', icon: <AccountBalance /> },
                  { type: 'contacts', label: 'Contacts', icon: <People /> },
                  { type: 'invoices', label: 'Invoices', icon: <Receipt /> },
                  { type: 'accounts', label: 'Accounts', icon: <Assessment /> },
                  { type: 'bank-transactions', label: 'Bank Transactions', icon: <AccountBalance /> },
                  { type: 'items', label: 'Items', icon: <Settings /> },
                  { type: 'tax-rates', label: 'Tax Rates', icon: <Assessment /> },
                  { type: 'tracking-categories', label: 'Tracking Categories', icon: <Settings /> },
                  { type: 'purchase-orders', label: 'Purchase Orders', icon: <Receipt /> },
                  { type: 'receipts', label: 'Receipts', icon: <Receipt /> },
                  { type: 'credit-notes', label: 'Credit Notes', icon: <Receipt /> },
                  { type: 'manual-journals', label: 'Manual Journals', icon: <Assessment /> },
                  { type: 'prepayments', label: 'Prepayments', icon: <Receipt /> },
                  { type: 'overpayments', label: 'Overpayments', icon: <Receipt /> },
                  { type: 'quotes', label: 'Quotes', icon: <Receipt /> }
                ].map(({ type, label, icon }) => (
                  <Grid item xs={12} sm={6} md={4} key={type}>
                    <Card 
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => loadSpecificData(type)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {icon}
                          <Typography variant="body2">{label}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {loadedData[type] && (
                            <Chip 
                              label={getDataCount(type)} 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          )}
                          {dataLoadingStates[type] && <CircularProgress size={16} />}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Data Display Tabs */}
        {isConnected && selectedTenant && Object.keys(loadedData).length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loaded Data
              </Typography>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                  {Object.keys(loadedData).map((dataType, index) => (
                    <Tab 
                      key={dataType}
                      label={`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} (${getDataCount(dataType)})`}
                      id={`xero-tab-${index}`}
                      aria-controls={`xero-tabpanel-${index}`}
                    />
                  ))}
                </Tabs>
              </Box>

              {Object.keys(loadedData).map((dataType, index) => (
                <TabPanel key={dataType} value={activeTab} index={index}>
                  {renderDataTable(dataType, loadedData[dataType])}
                </TabPanel>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!isConnected && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Getting Started
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                To access your Xero data:
              </Typography>
              <ol>
                <li>Ensure your administrator has configured Xero client credentials</li>
                <li>Click "Connect to Xero" to authorize the integration</li>
                <li>Select your organization from the list</li>
                <li>Load specific data types or load all data at once</li>
                <li>View and manage your Xero data in the tabs below</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </Box>
    </SidebarLayout>
  );
};

export default EnhancedXeroFlow;
