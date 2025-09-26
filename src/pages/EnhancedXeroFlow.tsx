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
  Divider,
  Paper,
  LinearProgress,
  Avatar,
  Badge,
  Fade,
  Slide,
  Zoom
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
  Warning,
  Business,
  TrendingUp,
  Speed,
  Security,
  AutoAwesome,
  DataUsage,
  TableChart,
  FilterList,
  Search,
  GetApp
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
  const [lastLoadTime, setLastLoadTime] = useState<{[key: string]: number}>({});
  const [toastCount, setToastCount] = useState(0);

  const { isConnected, hasSettings, selectedTenant, tenants, connectionStatus, error, isLoading } = state;

  // Helper function to show limited toasts
  const showLimitedToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    if (toastCount >= 3) {
      // Clear existing toasts if we have too many
      toast.dismiss();
      setToastCount(0);
    }
    
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message, { icon: '⚠️' });
    }
    
    setToastCount(prev => prev + 1);
    
    // Reset count after 5 seconds
    setTimeout(() => {
      setToastCount(prev => Math.max(0, prev - 1));
    }, 5000);
  };

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
      showLimitedToast(error.message || 'Failed to start Xero connection', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadSpecificData = async (dataType: string) => {
    if (!selectedTenant) {
      showLimitedToast('Please select a tenant first', 'error');
      return;
    }

    // Check if we're already loading this data type
    if (dataLoadingStates[dataType]) {
      return;
    }

    // Check if we loaded this data type recently (within 5 seconds)
    const now = Date.now();
    const lastLoad = lastLoadTime[dataType] || 0;
    if (now - lastLoad < 5000) {
      showLimitedToast('Please wait before loading this data type again', 'warning');
      return;
    }

    setDataLoadingStates(prev => ({ ...prev, [dataType]: true }));
    setLastLoadTime(prev => ({ ...prev, [dataType]: now }));
    
    try {
      console.log(`📊 Loading ${dataType} data...`);
      const result = await loadData(dataType);
      
      if (result.success) {
        setLoadedData(prev => ({ ...prev, [dataType]: result.data }));
        // Only show success toast for individual loads, not for bulk
        if (!isLoadingData) {
          showLimitedToast(`${dataType} data loaded successfully!`, 'success');
        }
      } else {
        showLimitedToast(`Failed to load ${dataType}: ${result.message}`, 'error');
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${dataType}:`, error);
      showLimitedToast(`Failed to load ${dataType}: ${error.message}`, 'error');
    } finally {
      setDataLoadingStates(prev => ({ ...prev, [dataType]: false }));
    }
  };

  const loadAllData = async () => {
    if (!selectedTenant) {
      showLimitedToast('Please select a tenant first', 'error');
      return;
    }

    // Check if we're already loading all data
    if (isLoadingData) {
      return;
    }

    // Check if we loaded all data recently (within 10 seconds)
    const now = Date.now();
    const lastLoadAll = lastLoadTime['all'] || 0;
    if (now - lastLoadAll < 10000) {
      showLimitedToast('Please wait before loading all data again', 'warning');
      return;
    }

    setIsLoadingData(true);
    setLastLoadTime(prev => ({ ...prev, all: now }));
    
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

      let successCount = 0;
      let errorCount = 0;

      // Load data sequentially to avoid rate limiting
      for (const type of dataTypes) {
        try {
          console.log(`📊 Loading ${type}...`);
          const result = await loadData(type);
          if (result.success) {
            setLoadedData(prev => ({ ...prev, [type]: result.data }));
            successCount++;
          } else {
            errorCount++;
          }
          // Add longer delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`⚠️ Failed to load ${type}:`, error);
          errorCount++;
        }
      }

      // Show single summary toast instead of individual ones
      if (successCount > 0) {
        showLimitedToast(`🎉 Loaded ${successCount} data types successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 'success');
      } else {
        showLimitedToast('Failed to load any data. Please try again.', 'error');
      }
      
    } catch (error: any) {
      console.error('❌ Error loading all data:', error);
      showLimitedToast('Failed to load data. Please try again.', 'error');
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
          <Box sx={{ 
            maxHeight: 600, 
            overflow: 'auto',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '14px',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'sticky', 
                  top: 0,
                  zIndex: 10
                }}>
                  {columns.map((column) => (
                    <th 
                      key={column}
                      style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #5a67d8',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'white',
                        position: 'relative'
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
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9ff',
                      borderBottom: '1px solid #e8eaf6',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9ff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {columns.map((column) => (
                      <td 
                        key={column}
                        style={{ 
                          padding: '12px 12px', 
                          borderBottom: '1px solid #e8eaf6',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                          fontWeight: '500'
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
        {/* Enhanced Header */}
        <Fade in timeout={800}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 4, 
              p: 4, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
                  <AutoAwesome sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Xero Flow
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                    Complete Data Management
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
                Comprehensive Xero integration with full data access, real-time synchronization, and advanced analytics
              </Typography>
            </Box>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.1)',
                zIndex: 1
              }} 
            />
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: -30, 
                left: -30, 
                width: 150, 
                height: 150, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.05)',
                zIndex: 1
              }} 
            />
          </Paper>
        </Fade>

        {/* Enhanced Connection Status */}
        <Slide direction="up" in timeout={600}>
          <Card 
            elevation={2} 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              border: isConnected ? '2px solid #4caf50' : '2px solid #f44336',
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: isConnected ? '#4caf50' : '#f44336',
                      width: 48,
                      height: 48
                    }}
                  >
                    {isConnected ? <CheckCircle /> : <ErrorIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Connection Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isConnected ? 'Successfully connected to Xero' : 'Not connected to Xero'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isConnected ? (
                    <Chip 
                      icon={<CheckCircle />} 
                      label="Connected" 
                      color="success" 
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ) : (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label="Not Connected" 
                      color="error" 
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                  {isLoading && <CircularProgress size={24} />}
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
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <CloudSync />}
                  onClick={handleOneClickConnect}
                  disabled={isConnecting || !hasSettings}
                  size="large"
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                    }
                  }}
                >
                  {isConnecting ? 'Connecting...' : 'Connect to Xero'}
                </Button>
                {!hasSettings && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Contact your administrator to configure Xero credentials
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={refreshConnection}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': {
                      borderColor: '#45a049',
                      backgroundColor: 'rgba(76, 175, 80, 0.04)',
                    }
                  }}
                >
                  Refresh Connection
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ErrorIcon />}
                  onClick={disconnect}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.04)',
                    }
                  }}
                >
                  Disconnect
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Tenant Selection */}
        {isConnected && tenants && tenants.length > 0 && (
          <Zoom in timeout={800}>
            <Card 
              elevation={2} 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                border: '2px solid #e3f2fd',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#2196F3', width: 40, height: 40 }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Organization Selection
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose your Xero organization to access data
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {tenants.map((tenant) => (
                    <Chip
                      key={tenant.id}
                      label={tenant.name}
                      onClick={() => selectTenant(tenant.id)}
                      color={selectedTenant?.id === tenant.id ? 'primary' : 'default'}
                      variant={selectedTenant?.id === tenant.id ? 'filled' : 'outlined'}
                      sx={{
                        height: 40,
                        fontSize: '0.9rem',
                        fontWeight: selectedTenant?.id === tenant.id ? 'bold' : 'normal',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        )}

        {/* Enhanced Data Management */}
        {isConnected && selectedTenant && (
          <Slide direction="up" in timeout={1000}>
            <Card 
              elevation={3} 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                border: '2px solid #e8f5e8',
                background: 'linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4caf50', width: 48, height: 48 }}>
                      <DataUsage />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Data Management
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Load and manage your Xero data
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={isLoadingData ? <CircularProgress size={20} color="inherit" /> : <Download />}
                      onClick={loadAllData}
                      disabled={isLoadingData}
                      size="large"
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #45a049 30%, #5cb85c 90%)',
                          boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                        }
                      }}
                    >
                      {isLoadingData ? 'Loading...' : 'Load All Data'}
                    </Button>
                  </Box>
                </Box>
                
                {isLoadingData && (
                  <Box sx={{ mb: 3 }}>
                    <LinearProgress 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        }
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Loading all Xero data types...
                    </Typography>
                  </Box>
                )}

              <Grid container spacing={2}>
                {[
                  { type: 'organization', label: 'Organization', icon: <AccountBalance />, color: '#2196F3' },
                  { type: 'contacts', label: 'Contacts', icon: <People />, color: '#4CAF50' },
                  { type: 'invoices', label: 'Invoices', icon: <Receipt />, color: '#FF9800' },
                  { type: 'accounts', label: 'Accounts', icon: <Assessment />, color: '#9C27B0' },
                  { type: 'bank-transactions', label: 'Bank Transactions', icon: <AccountBalance />, color: '#00BCD4' },
                  { type: 'items', label: 'Items', icon: <Settings />, color: '#795548' },
                  { type: 'tax-rates', label: 'Tax Rates', icon: <Assessment />, color: '#607D8B' },
                  { type: 'tracking-categories', label: 'Tracking Categories', icon: <Settings />, color: '#E91E63' },
                  { type: 'purchase-orders', label: 'Purchase Orders', icon: <Receipt />, color: '#3F51B5' },
                  { type: 'receipts', label: 'Receipts', icon: <Receipt />, color: '#FF5722' },
                  { type: 'credit-notes', label: 'Credit Notes', icon: <Receipt />, color: '#8BC34A' },
                  { type: 'manual-journals', label: 'Manual Journals', icon: <Assessment />, color: '#673AB7' },
                  { type: 'prepayments', label: 'Prepayments', icon: <Receipt />, color: '#009688' },
                  { type: 'overpayments', label: 'Overpayments', icon: <Receipt />, color: '#CDDC39' },
                  { type: 'quotes', label: 'Quotes', icon: <Receipt />, color: '#FFC107' }
                ].map(({ type, label, icon, color }, index) => (
                  <Grid item xs={12} sm={6} md={4} key={type}>
                    <Zoom in timeout={1200 + (index * 100)}>
                      <Card 
                        elevation={2}
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer',
                          borderRadius: 2,
                          border: loadedData[type] ? `2px solid ${color}` : '2px solid transparent',
                          background: loadedData[type] 
                            ? `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`
                            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                          transition: 'all 0.3s ease',
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 25px ${color}30`,
                            border: `2px solid ${color}`,
                          }
                        }}
                        onClick={() => loadSpecificData(type)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: color, 
                                width: 40, 
                                height: 40,
                                boxShadow: `0 4px 12px ${color}40`
                              }}
                            >
                              {icon}
                            </Avatar>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: loadedData[type] ? color : 'inherit' }}>
                              {label}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {loadedData[type] && (
                              <Badge 
                                badgeContent={getDataCount(type)} 
                                color="primary"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    backgroundColor: color,
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }
                                }}
                              >
                                <CheckCircle sx={{ color: color, fontSize: 20 }} />
                              </Badge>
                            )}
                            {dataLoadingStates[type] && (
                              <CircularProgress 
                                size={20} 
                                sx={{ color: color }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Data Display Tabs */}
        {isConnected && selectedTenant && Object.keys(loadedData).length > 0 && (
          <Fade in timeout={1400}>
            <Card 
              elevation={3} 
              sx={{ 
                borderRadius: 2,
                border: '2px solid #e1f5fe',
                background: 'linear-gradient(135deg, #f0f8ff 0%, #e1f5fe 100%)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#00BCD4', width: 48, height: 48 }}>
                    <TableChart />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Loaded Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View and analyze your Xero data
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  p: 1
                }}>
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="scrollable" 
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 'bold',
                        minHeight: 48,
                        borderRadius: 1,
                        mx: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: '#00BCD4',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)',
                        }
                      }
                    }}
                  >
                    {Object.keys(loadedData).map((dataType, index) => (
                      <Tab 
                        key={dataType}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                              {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
                            </Typography>
                            <Badge 
                              badgeContent={getDataCount(dataType)} 
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  backgroundColor: '#00BCD4',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          </Box>
                        }
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

        {/* Enhanced Instructions */}
        {!isConnected && (
          <Fade in timeout={1600}>
            <Card 
              elevation={2} 
              sx={{ 
                mt: 3, 
                borderRadius: 2,
                border: '2px solid #fff3e0',
                background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#FF9800', width: 48, height: 48 }}>
                    <AutoAwesome />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Getting Started
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Follow these steps to access your Xero data
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  {[
                    { step: 1, title: 'Configure Credentials', desc: 'Ensure your administrator has configured Xero client credentials', icon: <Security /> },
                    { step: 2, title: 'Connect to Xero', desc: 'Click "Connect to Xero" to authorize the integration', icon: <CloudSync /> },
                    { step: 3, title: 'Select Organization', desc: 'Choose your organization from the list', icon: <Business /> },
                    { step: 4, title: 'Load Data', desc: 'Load specific data types or all data at once', icon: <DataUsage /> },
                    { step: 5, title: 'View & Manage', desc: 'View and manage your Xero data in organized tables', icon: <TableChart /> }
                  ].map(({ step, title, desc, icon }) => (
                    <Grid item xs={12} sm={6} md={4} key={step}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}>
                        <Avatar sx={{ bgcolor: '#FF9800', mb: 1, width: 40, height: 40 }}>
                          {icon}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#FF9800' }}>
                          {step}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Box>
    </SidebarLayout>
  );
};

export default EnhancedXeroFlow;
