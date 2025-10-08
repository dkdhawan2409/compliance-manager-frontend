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
    // More aggressive rate limiting
    if (toastCount >= 2) {
      // Clear existing toasts if we have too many
      toast.dismiss();
      setToastCount(0);
    }
    
    // Prevent duplicate messages
    const now = Date.now();
    const lastToastTime = (window as any).lastToastTime || 0;
    if (now - lastToastTime < 1000) { // 1 second between toasts
      return;
    }
    (window as any).lastToastTime = now;
    
    if (type === 'success') {
      toast.success(message, { duration: 3000 });
    } else if (type === 'error') {
      toast.error(message, { duration: 4000 });
    } else {
      toast(message, { icon: '⚠️', duration: 3000 });
    }
    
    setToastCount(prev => prev + 1);
    
    // Reset count after 3 seconds
    setTimeout(() => {
      setToastCount(prev => Math.max(0, prev - 1));
    }, 3000);
  };

  // Auto-select first tenant if only one is available
  useEffect(() => {
    if (tenants && tenants.length === 1 && !selectedTenant) {
      console.log('🎯 Auto-selecting single tenant:', tenants[0].name);
      selectTenant(tenants[0].id);
    }
  }, [tenants, selectedTenant, selectTenant]);

  // Check for token expiration and show reconnection message
  useEffect(() => {
    if (!isConnected && hasSettings) {
      console.log('⚠️ Xero not connected but credentials exist - likely token expired');
      showLimitedToast('Xero connection expired. Please reconnect to view your data.', 'warning');
    }
  }, [isConnected, hasSettings]);

  // Refresh connection status when component mounts and handle OAuth callback
  useEffect(() => {
    const refreshOnMount = async () => {
      try {
        console.log('🔄 Refreshing Xero connection status...');
        await loadSettings();
        await refreshConnection();
        
        // Check if we just returned from OAuth (URL might have success parameter)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          console.log('🎉 OAuth completed successfully, refreshing state...');
          showLimitedToast('Xero connection successful!', 'success');
          
          // Clear the URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Force refresh connection status to get latest data
          setTimeout(async () => {
            try {
              console.log('🔄 Force refreshing connection after OAuth success...');
              await loadSettings();
              await refreshConnection();
              
              // If we have tenants but no selected tenant, auto-select the first one
              if (state.tenants && state.tenants.length > 0 && !state.selectedTenant) {
                console.log('🎯 Auto-selecting first tenant after OAuth success');
                selectTenant(state.tenants[0].id);
              }
            } catch (error) {
              console.log('⚠️ Failed to refresh after OAuth success:', error);
            }
          }, 1000);
        }
      } catch (error) {
        console.log('⚠️ Failed to refresh connection status:', error);
      }
    };

    refreshOnMount();
  }, [loadSettings, refreshConnection, selectTenant, state.tenants, state.selectedTenant]);

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
    // Validate dataType parameter
    if (!dataType || typeof dataType !== 'string' || dataType.trim() === '') {
      console.error('❌ loadSpecificData: Invalid dataType:', dataType);
      showLimitedToast('Invalid data type specified', 'error');
      return;
    }

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
      
      // Create a properly typed request object
      const request = {
        resourceType: dataType.trim() as any, // Ensure it's a string and trim whitespace
        tenantId: selectedTenant.id,
        page: 1,
        pageSize: 1000  // Fetch up to 1000 records to get all data
      };
      
      console.log('🔧 loadSpecificData request object:', request);
      
      const result = await loadData(request);
      
      if (result.success) {
        setLoadedData(prev => ({ ...prev, [dataType]: result.data }));
        // Only show success toast for individual loads, not for bulk
        if (!isLoadingData) {
          showLimitedToast(`${dataType} data loaded successfully!`, 'success');
        }
      } else {
        // Check if it's a token expiration error
        if (result.message && result.message.includes('expired')) {
          showLimitedToast('Xero connection expired. Please reconnect to view data.', 'error');
        } else {
          showLimitedToast(`Failed to load ${dataType}: ${result.message}`, 'error');
        }
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${dataType}:`, error);
      // Check if it's a token expiration error
      if (error.message && (error.message.includes('expired') || error.message.includes('unauthorized'))) {
        showLimitedToast('Xero connection expired. Please reconnect to view data.', 'error');
      } else {
        showLimitedToast(`Failed to load ${dataType}: ${error.message}`, 'error');
      }
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
        'transactions',
        'items',
        'tax-rates',
        'tracking-categories',
        'purchase-orders',
        'receipts',
        'credit-notes',
        'manual-journals',
        'prepayments',
        'overpayments',
        'quotes',
        'payments',
        'journals'
      ];

      let successCount = 0;
      let errorCount = 0;

      // Load data sequentially to avoid rate limiting
      for (const type of dataTypes) {
        try {
          console.log(`📊 Loading ${type}...`);
          
          // Validate and create proper request object
          if (!type || typeof type !== 'string') {
            console.error('❌ loadAllData: Invalid type in dataTypes array:', type);
            continue;
          }
          
          const request = {
            resourceType: type.trim() as any,
            tenantId: selectedTenant.id,
            page: 1,
            pageSize: 1000  // Fetch up to 1000 records per request to get all data
          };
          
          console.log('🔧 loadAllData request object:', request);
          
          const result = await loadData(request);
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
        // Check if all errors are due to token expiration
        if (errorCount === dataTypes.length) {
          showLimitedToast('Xero connection expired. Please reconnect to view all data.', 'error');
        } else {
          showLimitedToast('Failed to load any data. Please try again.', 'error');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error loading all data:', error);
      if (error.message && (error.message.includes('expired') || error.message.includes('unauthorized'))) {
        showLimitedToast('Xero connection expired. Please reconnect to view data.', 'error');
      } else {
        showLimitedToast('Failed to load data. Please try again.', 'error');
      }
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
    
    // Extract the actual data array from Xero API response
    let actualData: any[] = [];
    
    if (Array.isArray(data)) {
      actualData = data;
    } else if (data && typeof data === 'object') {
      // Try to extract the data array from common Xero API response patterns
      const possibleKeys = [
        dataType, // e.g., 'contacts'
        dataType.charAt(0).toUpperCase() + dataType.slice(1), // e.g., 'Contacts'
        'items',
        'results',
        'data'
      ];
      
      for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
          actualData = data[key];
          break;
        }
      }
      
      // If still no array found, treat as single object
      if (actualData.length === 0) {
        actualData = [data];
      }
    }
    
    if (actualData.length === 0) {
      return <Typography color="text.secondary">No {dataType} data available</Typography>;
    }

    // Get the first item to determine table structure
    const firstItem = actualData[0];
    const columns = Object.keys(firstItem);
    
    return (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Typography variant="h6" sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 'bold'
            }}>
              {dataType.charAt(0).toUpperCase() + dataType.slice(1)} 
              <Chip 
                label={`${actualData.length} records`} 
                color="primary" 
                size="small" 
                sx={{ ml: 1, fontWeight: 'bold' }}
              />
            </Typography>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Typography variant="caption" color="text.secondary">
                Scroll horizontally to view all columns
              </Typography>
            </Box>
          </Box>
          
          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
            {actualData.map((item: any, index: number) => (
              <Card key={index} sx={{ mb: 1, p: 2 }}>
                {Object.entries(item).slice(0, 8).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      {key}:
                    </Typography>
                    <Typography variant="caption" sx={{ flex: 1, textAlign: 'right' }}>
                      {renderMobileCellValue(value)}
                    </Typography>
                  </Box>
                ))}
                {Object.keys(item).length > 8 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    +{Object.keys(item).length - 8} more fields
                  </Typography>
                )}
              </Card>
            ))}
            {actualData.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                ✅ Showing all {actualData.length} records in mobile view
              </Typography>
            )}
          </Box>
          
          {/* Desktop Table View */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'block' },
            maxHeight: 600, 
            overflow: 'auto',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                background: '#a8a8a8'
              }
            }
          }}>
            <Box sx={{ 
              overflowX: 'auto',
              minWidth: { xs: '100%', sm: '600px' }
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: '14px',
                backgroundColor: 'white',
                minWidth: '600px' // Ensure table has minimum width for readability
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
                        padding: '12px 8px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #5a67d8',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'white',
                        position: 'relative',
                        minWidth: '100px'
                      }}
                    >
                      <Box sx={{ 
                        display: { xs: 'none', sm: 'block' }
                      }}>
                        {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Box>
                      <Box sx={{ 
                        display: { xs: 'block', sm: 'none' },
                        fontSize: '10px'
                      }}>
                        {column.substring(0, 8)}...
                      </Box>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actualData.map((item: any, index: number) => (
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
                          padding: '8px 6px', 
                          borderBottom: '1px solid #e8eaf6',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                        title={typeof item[column] === 'object' ? JSON.stringify(item[column]) : String(item[column] || '')}
                      >
                        <Box sx={{
                          display: { xs: 'none', sm: 'block' }
                        }}>
                          {renderCellValue(item[column])}
                        </Box>
                        <Box sx={{
                          display: { xs: 'block', sm: 'none' },
                          fontSize: '10px'
                        }}>
                          {renderMobileCellValue(item[column])}
                        </Box>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {actualData.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  ✅ Showing all {actualData.length} records (fetched up to 1000 per request)
                </Typography>
                {actualData.length >= 1000 && (
                  <Typography color="warning.main" variant="caption">
                    Note: If you have more than 1000 records, only the first 1000 are shown. 
                    Contact support for bulk data export.
                  </Typography>
                )}
              </Box>
            )}
            </Box>
          </Box>
        </Box>
      );
    
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

  const renderMobileCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>—</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span style={{ color: value ? '#4caf50' : '#f44336' }}>{value ? '✓' : '✗'}</span>;
    }
    
    if (typeof value === 'number') {
      return <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      if (value.length > 15) {
        return (
          <span title={value} style={{ fontSize: '10px' }}>
            {value.substring(0, 15)}...
          </span>
        );
      }
      return <span style={{ fontSize: '10px' }}>{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return <span style={{ fontSize: '10px', color: '#2196f3' }}>{value.length} items</span>;
    }
    
    if (typeof value === 'object') {
      return <span style={{ fontSize: '10px', color: '#9c27b0' }}>Object</span>;
    }
    
    return <span style={{ fontSize: '10px' }}>{String(value)}</span>;
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
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Enhanced Header */}
        <Fade in timeout={800}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: { xs: 2, sm: 4 }, 
              p: { xs: 2, sm: 4 }, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: { xs: 2, sm: 3 },
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  mr: { xs: 0, sm: 2 }, 
                  mb: { xs: 2, sm: 0 },
                  width: { xs: 48, sm: 56 }, 
                  height: { xs: 48, sm: 56 } 
                }}>
                  <AutoAwesome sx={{ fontSize: { xs: 24, sm: 32 } }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    mb: 0.5,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                  }}>
                    Xero Flow
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    opacity: 0.9, 
                    fontWeight: 300,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    Complete Data Management
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.9, 
                maxWidth: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
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
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: isConnected ? '#4caf50' : '#f44336',
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 }
                    }}
                  >
                    {isConnected ? <CheckCircle /> : <ErrorIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}>
                      Connection Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      {isConnected ? 'Successfully connected to Xero' : 'Not connected to Xero'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  flexDirection: { xs: 'row', sm: 'row' }
                }}>
                  {isConnected ? (
                    <Chip 
                      icon={<CheckCircle />} 
                      label="Connected" 
                      color="success" 
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  ) : (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label="Not Connected" 
                      color="error" 
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  )}
                  {isLoading && <CircularProgress size={20} />}
                </Box>
              </Box>

            {!hasSettings && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠️ Xero Client ID is not configured. Please ask your administrator to configure Xero client credentials.
              </Alert>
            )}

            {!isConnected && hasSettings && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🔄 Reconnection Required
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Your Xero connection has expired. Click "Connect to Xero" below to reconnect and access all your transaction data.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  After reconnecting, you'll be able to view all transaction types including:
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {['Bank Transactions', 'General Transactions', 'Payments', 'Journals', 'Invoices', 'Contacts', 'Accounts'].map((type) => (
                    <Chip key={type} label={type} size="small" variant="outlined" />
                  ))}
                </Box>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!isConnected ? (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center', 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                <Button
                  variant="contained"
                  startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <CloudSync />}
                  onClick={handleOneClickConnect}
                  disabled={isConnecting}
                  size="large"
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    borderRadius: 2,
                    px: { xs: 3, sm: 4 },
                    py: 1.5,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                    }
                  }}
                >
                  {isConnecting ? 'Connecting...' : 'Connect to Xero'}
                </Button>
                {!hasSettings && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}>
                    <Warning color="warning" />
                    <Typography variant="body2" color="text.secondary" sx={{
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Xero credentials may not be configured. If connection fails, please ask your administrator to set up Xero client credentials.
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center', 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={refreshConnection}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 2,
                    px: { xs: 2, sm: 3 },
                    py: 1,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    width: { xs: '100%', sm: 'auto' },
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
                    px: { xs: 2, sm: 3 },
                    py: 1,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
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
        </Slide>

        {/* Enhanced Tenant Selection */}
        {(isConnected || (tenants && tenants.length > 0)) && (
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
                
                {tenants && tenants.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {tenants.map((tenant) => (
                      <Chip
                        key={tenant.id}
                        label={tenant.name || tenant.organizationName || tenant.tenantName || 'Unnamed Organization'}
                        onClick={() => {
                          console.log('🎯 Selecting tenant:', tenant);
                          selectTenant(tenant.id);
                          showLimitedToast(`Selected organization: ${tenant.name || tenant.organizationName || 'Unnamed'}`, 'success');
                        }}
                        color={selectedTenant?.id === tenant.id ? 'primary' : 'default'}
                        variant={selectedTenant?.id === tenant.id ? 'filled' : 'outlined'}
                        icon={selectedTenant?.id === tenant.id ? <CheckCircle /> : undefined}
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
                ) : (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      No Organizations Found
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {!isConnected && hasSettings 
                        ? 'Your Xero tokens have expired. Organizations are not available until you reconnect.'
                        : 'Your Xero connection doesn\'t have any organizations loaded yet. This usually means the OAuth callback didn\'t complete fully.'
                      }
                    </Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={async () => {
                        try {
                          showLimitedToast('Refreshing connection and loading organizations...', 'success');
                          await refreshConnection();
                          // Force reload settings to get fresh tenant data
                          await loadSettings();
                          showLimitedToast('Connection refreshed successfully', 'success');
                        } catch (error) {
                          console.error('Failed to refresh:', error);
                          showLimitedToast('Failed to refresh connection', 'error');
                        }
                      }}
                      startIcon={<Refresh />}
                    >
                      Refresh Connection
                    </Button>
                  </Alert>
                )}
                
                {selectedTenant && (
                  <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
                    <Typography variant="body2">
                      <strong>Selected:</strong> {selectedTenant.name || selectedTenant.organizationName || 'Unnamed Organization'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All data operations will use this organization
                      {!isConnected && ' (Note: Tokens expired - may need to reconnect for data access)'}
                    </Typography>
                  </Alert>
                )}
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
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Button
                      variant="contained"
                      startIcon={isLoadingData ? <CircularProgress size={20} color="inherit" /> : <Download />}
                      onClick={loadAllData}
                      disabled={isLoadingData}
                      size="large"
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        borderRadius: 2,
                        px: { xs: 2, sm: 3 },
                        py: 1.5,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        width: { xs: '100%', sm: 'auto' },
                        fontSize: { xs: '0.875rem', sm: '1rem' },
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

              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {[
                  { type: 'organization', label: 'Organization', icon: <AccountBalance />, color: '#2196F3' },
                  { type: 'contacts', label: 'Contacts', icon: <People />, color: '#4CAF50' },
                  { type: 'invoices', label: 'Invoices', icon: <Receipt />, color: '#FF9800' },
                  { type: 'accounts', label: 'Accounts', icon: <Assessment />, color: '#9C27B0' },
                  { type: 'bank-transactions', label: 'Bank Transactions', icon: <AccountBalance />, color: '#00BCD4' },
                  { type: 'transactions', label: 'Transactions', icon: <Receipt />, color: '#17a2b8' },
                  { type: 'items', label: 'Items', icon: <Settings />, color: '#795548' },
                  { type: 'tax-rates', label: 'Tax Rates', icon: <Assessment />, color: '#607D8B' },
                  { type: 'tracking-categories', label: 'Tracking Categories', icon: <Settings />, color: '#E91E63' },
                  { type: 'purchase-orders', label: 'Purchase Orders', icon: <Receipt />, color: '#3F51B5' },
                  { type: 'receipts', label: 'Receipts', icon: <Receipt />, color: '#FF5722' },
                  { type: 'credit-notes', label: 'Credit Notes', icon: <Receipt />, color: '#8BC34A' },
                  { type: 'manual-journals', label: 'Manual Journals', icon: <Assessment />, color: '#673AB7' },
                  { type: 'prepayments', label: 'Prepayments', icon: <Receipt />, color: '#009688' },
                  { type: 'overpayments', label: 'Overpayments', icon: <Receipt />, color: '#CDDC39' },
                  { type: 'quotes', label: 'Quotes', icon: <Receipt />, color: '#FFC107' },
                  { type: 'payments', label: 'Payments', icon: <Receipt />, color: '#28a745' },
                  { type: 'journals', label: 'Journals', icon: <Assessment />, color: '#6f42c1' }
                ].map(({ type, label, icon, color }, index) => (
                  <Box key={type} sx={{ 
                    width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)', lg: 'calc(25% - 12px)' },
                    display: 'inline-block',
                    verticalAlign: 'top',
                    mb: 2
                  }}>
                    <Zoom in timeout={1200 + (index * 100)}>
                      <Card 
                        elevation={2}
                        sx={{ 
                          p: { xs: 1.5, sm: 2 }, 
                          cursor: 'pointer',
                          borderRadius: 2,
                          border: loadedData[type] ? `2px solid ${color}` : '2px solid transparent',
                          background: loadedData[type] 
                            ? `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`
                            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                          transition: 'all 0.3s ease',
                          minHeight: { xs: 80, sm: 100 },
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 25px ${color}30`,
                            border: `2px solid ${color}`,
                          }
                        }}
                        onClick={() => loadSpecificData(type)}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 1, sm: 0 }
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 1, sm: 1.5 },
                            flexDirection: { xs: 'column', sm: 'row' },
                            textAlign: { xs: 'center', sm: 'left' }
                          }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: color, 
                                width: { xs: 32, sm: 40 }, 
                                height: { xs: 32, sm: 40 },
                                boxShadow: `0 4px 12px ${color}40`
                              }}
                            >
                              {icon}
                            </Avatar>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 'bold', 
                              color: loadedData[type] ? color : 'inherit',
                              fontSize: { xs: '0.8rem', sm: '0.875rem' }
                            }}>
                              {label}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            justifyContent: { xs: 'center', sm: 'flex-end' }
                          }}>
                            {loadedData[type] && (
                              <Badge 
                                badgeContent={getDataCount(type)} 
                                color="primary"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    backgroundColor: color,
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '0.6rem', sm: '0.75rem' }
                                  }
                                }}
                              >
                                <CheckCircle sx={{ 
                                  color: color, 
                                  fontSize: { xs: 16, sm: 20 } 
                                }} />
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
                  </Box>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Slide>
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
        </Fade>
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
                
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  {[
                    { step: 1, title: 'Configure Credentials', desc: 'Ensure your administrator has configured Xero client credentials', icon: <Security /> },
                    { step: 2, title: 'Connect to Xero', desc: 'Click "Connect to Xero" to authorize the integration', icon: <CloudSync /> },
                    { step: 3, title: 'Select Organization', desc: 'Choose your organization from the list', icon: <Business /> },
                    { step: 4, title: 'Load Data', desc: 'Load specific data types or all data at once', icon: <DataUsage /> },
                    { step: 5, title: 'View & Manage', desc: 'View and manage your Xero data in organized tables', icon: <TableChart /> }
                  ].map(({ step, title, desc, icon }) => (
                    <Box key={step} sx={{ 
                      width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' },
                      display: 'inline-block',
                      verticalAlign: 'top',
                      mb: 2
                    }}>
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
                    </Box>
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
