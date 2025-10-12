import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Settings, 
  AlertTriangle, 
  Send, 
  Link, 
  BarChart3, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileX,
  Smartphone,
  Mail,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import SidebarLayout from '../components/SidebarLayout';
import {
  getMissingAttachmentConfig,
  updateMissingAttachmentConfig,
  detectMissingAttachments,
  processMissingAttachments,
  getUploadLinks,
  getMissingAttachmentStatistics,
  checkTokenStatus,
  MissingAttachmentConfig,
  MissingTransaction,
  UploadLink,
  Statistics,
  TokenStatus
} from '../api/missingAttachmentService';
import { useXero } from '../contexts/XeroContext';

const MissingAttachments: React.FC = () => {
  const { state: xeroState, refreshToken, selectTenant } = useXero();
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'transactions' | 'links'>('overview');
  const [config, setConfig] = useState<MissingAttachmentConfig | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [missingTransactions, setMissingTransactions] = useState<MissingTransaction[]>([]);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const lastRefreshRef = useRef<number>(0);

  const activeTenantId = useMemo(
    () => xeroState.selectedTenant?.tenantId || xeroState.selectedTenant?.id || null,
    [xeroState.selectedTenant]
  );

  const loadData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // Debounce API calls - only refresh if forced or if more than 5 seconds have passed
    if (!forceRefresh && timeSinceLastRefresh < 5000) {
      console.log('Skipping refresh - too soon since last call');
      return;
    }
    
    try {
      setLoading(true);
      lastRefreshRef.current = now;
      const [configData, statsData, tokenStatusData] = await Promise.all([
        getMissingAttachmentConfig(),
        getMissingAttachmentStatistics(30),
        checkTokenStatus()
      ]);
      
      setConfig(configData);
      setStatistics(statsData);
      setTokenStatus(tokenStatusData);
      
      // Show token expiry warnings
      if (tokenStatusData.status === 'warning') {
        toast.error(`⚠️ Xero token expires in ${tokenStatusData.daysUntilExpiry} days. Please reconnect soon.`, {
          duration: 8000,
          action: {
            label: 'Reconnect Now',
            onClick: () => window.location.href = '/xero'
          }
        });
      } else if (tokenStatusData.status === 'expired') {
        toast.error('❌ Xero token has expired. Please reconnect to continue using missing attachments detection.', {
          duration: 10000,
          action: {
            label: 'Reconnect Now',
            onClick: () => window.location.href = '/xero'
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load missing attachments data');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent circular reference

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfigUpdate = useCallback(async (updates: Partial<MissingAttachmentConfig>) => {
    if (!config) return;
    
    try {
      const updatedConfig = await updateMissingAttachmentConfig(updates);
      setConfig(updatedConfig);
      toast.success('Configuration updated successfully');
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  }, [config]);

  const handleDetectMissing = useCallback(async () => {
    try {
      setLoading(true);
      
      // Pre-flight check: Ensure Xero is connected before attempting detection
      if (!xeroState.isConnected) {
        toast.error('Xero not connected. Please connect to Xero Flow first.', {
          duration: 6000,
          action: {
            label: 'Go to Xero Flow',
            onClick: () => window.open('/xero', '_blank')
          }
        });
        return;
      }

      if (!activeTenantId) {
        toast.error('Select a Xero organization before detecting missing attachments.');
        return;
      }
      
      const result = await detectMissingAttachments(activeTenantId);
      setMissingTransactions(result.transactions);
      toast.success(`Found ${result.totalTransactions} transactions without attachments`);
    } catch (error: any) {
      console.error('Error detecting missing attachments:', error);
      
      // Show specific error messages for Xero connection issues
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.errorCode || error.response?.data?.code;
      console.log('🔍 Error details:', { errorMessage, errorCode, fullError: error });
      
      // Handle XERO_TOKEN_EXPIRED error code
      if (errorCode === 'XERO_TOKEN_EXPIRED' || 
          errorMessage.includes('XERO_TOKEN_EXPIRED') ||
          errorMessage.includes('Token expired') ||
          errorMessage.includes('token has expired')) {
        
        toast.error((t) => (
          <div>
            <strong>Xero Token Expired</strong>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              Your Xero connection has expired. Please reconnect to Xero to continue accessing transaction data.
            </p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                // Clear expired tokens
                localStorage.removeItem('xero_authorized');
                localStorage.removeItem('xero_auth_timestamp');
                localStorage.removeItem('xero_tokens');
                window.location.href = '/xero';
              }}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Reconnect to Xero Now
            </button>
          </div>
        ), {
          duration: 20000,
          icon: '🔄'
        });
        return; // Exit early
      }
      
      if (errorMessage.includes('Xero not connected') || 
          errorMessage.includes('access token not found') ||
          errorMessage.includes('Not connected to Xero') ||
          errorMessage.includes('NOT_CONNECTED')) {
        toast.error((t) => (
          <div>
            <strong>Xero Not Connected</strong>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>Please connect to Xero first to access transaction data.</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/xero';
              }}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px',
                fontSize: '14px'
              }}
            >
              Connect to Xero Now
            </button>
          </div>
        ), {
          duration: 15000
        });
      } else if (errorMessage.includes('refresh token has expired') || 
                 errorMessage.includes('Please reconnect to Xero Flow') ||
                 errorMessage.includes('Xero refresh token has expired') ||
                 errorMessage.includes('No refresh token available') ||
                 errorMessage.includes('needs to re-authorize')) {
        
        toast.error((t) => (
          <div>
            <strong>Xero Authorization Expired</strong>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              Your Xero authorization has expired (tokens are valid for 60 days). 
              Please reconnect to Xero to continue.
            </p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                // Clear expired tokens
                localStorage.removeItem('xero_authorized');
                localStorage.removeItem('xero_auth_timestamp');
                localStorage.removeItem('xero_tokens');
                window.location.href = '/xero';
              }}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px',
                fontSize: '14px'
              }}
            >
              Reconnect to Xero
            </button>
          </div>
        ), {
          duration: 15000
        });
      } else if (errorMessage.includes('token expired')) {
        // First attempt to refresh the token automatically
        try {
          console.log('🔄 Attempting automatic token refresh...');
          await refreshToken();
          
          // If refresh was successful, retry the operation
          console.log('✅ Token refresh successful, retrying detection...');
          const result = await detectMissingAttachments(activeTenantId);
          setMissingTransactions(result.transactions);
          toast.success(`Found ${result.totalTransactions} transactions without attachments`);
          return; // Exit early on success
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);
          // Fall through to show reconnect message
        }
        
        toast.error('Xero token expired. Please reconnect to Xero.', {
          duration: 6000,
          action: {
            label: 'Reconnect',
            onClick: () => window.open('/xero', '_blank')
          }
        });
      } else if (errorMessage.includes('tenant not found')) {
        toast.error('Xero tenant not found. Please reconnect to Xero.');
      } else {
        // Check if it's a general token expiration error
        if (errorMessage.includes('expired') || errorMessage.includes('invalid token')) {
          toast.error('Xero authentication expired. Please reconnect to Xero Flow to continue.', {
            duration: 8000,
            action: {
              label: 'Reconnect to Xero',
              onClick: () => {
                localStorage.removeItem('xero_authorized');
                localStorage.removeItem('xero_auth_timestamp');
                localStorage.removeItem('xero_tokens');
                window.location.href = '/xero';
              }
            }
          });
        } else {
          // For any other errors, provide a helpful message
          toast.error(`Failed to detect missing attachments: ${errorMessage}`, {
            duration: 6000,
            action: {
              label: 'Try Xero Flow',
              onClick: () => window.location.href = '/xero'
            }
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [refreshToken, xeroState.isConnected, activeTenantId]);

  const handleProcessMissing = useCallback(async () => {
    try {
      setProcessing(true);
      
      // Pre-flight check: Ensure Xero is connected before attempting processing
      if (!xeroState.isConnected) {
        toast.error('Xero not connected. Please connect to Xero Flow first.', {
          duration: 6000,
          action: {
            label: 'Go to Xero Flow',
            onClick: () => window.open('/xero', '_blank')
          }
        });
        return;
      }
      
      const result = await processMissingAttachments();
      toast.success(`Processed ${result.totalTransactions} transactions, sent ${result.smssSent} notifications`);
      
      // Refresh data
      await loadData();
      await loadUploadLinks();
    } catch (error: any) {
      console.error('Error processing missing attachments:', error);
      
      // Show specific error messages for Xero connection issues
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.errorCode || error.response?.data?.code;
      console.log('🔍 Process error details:', { errorMessage, errorCode, fullError: error });
      
      // Handle XERO_TOKEN_EXPIRED error code
      if (errorCode === 'XERO_TOKEN_EXPIRED' || 
          errorMessage.includes('XERO_TOKEN_EXPIRED') ||
          errorMessage.includes('Token expired') ||
          errorMessage.includes('token has expired')) {
        
        toast.error((t) => (
          <div>
            <strong>Xero Token Expired</strong>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              Your Xero connection has expired. Please reconnect to Xero to continue.
            </p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem('xero_authorized');
                localStorage.removeItem('xero_auth_timestamp');
                localStorage.removeItem('xero_tokens');
                window.location.href = '/xero';
              }}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Reconnect to Xero Now
            </button>
          </div>
        ), {
          duration: 20000,
          icon: '🔄'
        });
        return; // Exit early
      }
      
      if (errorMessage.includes('refresh token has expired') || 
          errorMessage.includes('Please reconnect to Xero Flow') ||
          errorMessage.includes('Xero refresh token has expired')) {
        // First attempt to refresh the token automatically
        try {
          console.log('🔄 Attempting automatic token refresh...');
          await refreshToken();
          
          // If refresh was successful, retry the operation
          console.log('✅ Token refresh successful, retrying process...');
          const result = await processMissingAttachments();
          toast.success(`Processed ${result.totalTransactions} transactions, sent ${result.smssSent} notifications`);
          
          // Refresh data
          await loadData();
          await loadUploadLinks();
          return; // Exit early on success
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);
          // Fall through to show reconnect message
        }
        
        toast.error('Xero connection expired. Please reconnect to Xero Flow to continue.', {
          duration: 10000,
          action: {
            label: 'Reconnect Now',
            onClick: () => {
              // Clear any existing Xero state
              localStorage.removeItem('xero_authorized');
              localStorage.removeItem('xero_auth_timestamp');
              localStorage.removeItem('xero_tokens');
              // Redirect to Xero Flow page
              window.location.href = '/xero';
            }
          }
        });
      } else if (errorMessage.includes('token expired')) {
        // First attempt to refresh the token automatically
        try {
          console.log('🔄 Attempting automatic token refresh...');
          await refreshToken();
          
          // If refresh was successful, retry the operation
          console.log('✅ Token refresh successful, retrying process...');
          const result = await processMissingAttachments();
          toast.success(`Processed ${result.totalTransactions} transactions, sent ${result.smssSent} notifications`);
          
          // Refresh data
          await loadData();
          await loadUploadLinks();
          return; // Exit early on success
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);
          // Fall through to show reconnect message
        }
        
        toast.error('Xero token expired. Please reconnect to Xero.', {
          duration: 6000,
          action: {
            label: 'Reconnect',
            onClick: () => window.open('/xero', '_blank')
          }
        });
      } else {
        // Check if it's a general token expiration error
        if (errorMessage.includes('expired') || errorMessage.includes('invalid token')) {
          toast.error('Xero authentication expired. Please reconnect to Xero Flow to continue.', {
            duration: 8000,
            action: {
              label: 'Reconnect to Xero',
              onClick: () => {
                localStorage.removeItem('xero_authorized');
                localStorage.removeItem('xero_auth_timestamp');
                localStorage.removeItem('xero_tokens');
                window.location.href = '/xero';
              }
            }
          });
        } else {
          toast.error(`Failed to process missing attachments: ${errorMessage}`);
        }
      }
    } finally {
      setProcessing(false);
    }
  }, [loadData, refreshToken]);

  const loadUploadLinks = useCallback(async (status: 'all' | 'active' | 'used' | 'expired' = 'all') => {
    try {
      const result = await getUploadLinks(1, 50, status);
      setUploadLinks(result.links);
    } catch (error: any) {
      console.error('Error loading upload links:', error);
      toast.error('Failed to load upload links');
    }
  }, []);

  const handleTabChange = useCallback((tab: 'overview' | 'config' | 'transactions' | 'links') => {
    setActiveTab(tab);
    
    // Only load specific data when switching to certain tabs
    if (tab === 'links' && uploadLinks.length === 0) {
      loadUploadLinks();
    }
  }, [uploadLinks.length, loadUploadLinks]);

  const formatCurrency = (amount: number, currency = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading && !config) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missing Attachments</h1>
          <p className="text-gray-600">Monitor and manage transactions without receipts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDetectMissing}
            disabled={loading || !xeroState.isConnected}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            title={!xeroState.isConnected ? "Xero not connected. Please connect to Xero Flow first." : ""}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan for Missing</span>
          </button>
          <button
            onClick={handleProcessMissing}
            disabled={processing || !xeroState.isConnected}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            title={!xeroState.isConnected ? "Xero not connected. Please connect to Xero Flow first." : ""}
          >
            <Send className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
            <span>Send Notifications</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Links Created"
            value={statistics.totalLinks}
            icon={<Link className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            subtitle={`Last ${statistics.period}`}
          />
          <StatCard
            title="Conversion Rate"
            value={`${statistics.conversionRate}%`}
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="bg-green-500"
            subtitle={`${statistics.usedLinks} uploaded`}
          />
          <StatCard
            title="Active Links"
            value={statistics.activeLinks}
            icon={<Clock className="w-6 h-6 text-white" />}
            color="bg-yellow-500"
            subtitle="Not expired"
          />
          <StatCard
            title="Total SMS Sent"
            value={statistics.totalNotificationsSent}
            icon={<Smartphone className="w-6 h-6 text-white" />}
            color="bg-purple-500"
            subtitle="All time"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'transactions', label: 'Missing Transactions', icon: FileX },
            { id: 'links', label: 'Upload Links', icon: Link }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Xero Connection Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Xero Connection Status</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${xeroState.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-900">
                  {xeroState.isConnected ? 'Connected' : 'Not Connected'}
                </span>
                <span className="text-xs text-gray-500">
                  ({xeroState.selectedTenant?.name || 'No organization selected'})
                </span>
              </div>
              {!xeroState.isConnected && (
                <a
                  href="/xero"
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                >
                  Connect Xero
                </a>
              )}
            </div>
            {!xeroState.isConnected && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Real Xero data is not available. Please connect to Xero Flow to detect actual missing attachments.
                </p>
              </div>
            )}
            
            {/* Xero Organization Selection */}
            {xeroState.isConnected && xeroState.tenants && xeroState.tenants.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Xero Organization</h3>
                <div className="flex items-center gap-4">
                  <select
                    value={activeTenantId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const tenant = xeroState.tenants.find(
                        (t: any) => t.tenantId === value || t.id === value
                      );
                      if (tenant) {
                        selectTenant(tenant);
                        console.log('🎯 Selected organization for Missing Attachments:', tenant);
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Xero Organization</option>
                    {xeroState.tenants.map((tenant: any) => (
                      <option
                        key={tenant.tenantId || tenant.id}
                        value={tenant.tenantId || tenant.id}
                      >
                        {tenant.name || tenant.organizationName || tenant.tenantName || tenant.id}
                      </option>
                    ))}
                  </select>
                  {xeroState.selectedTenant && (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {xeroState.selectedTenant.name || 'Selected'}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Missing attachments will be detected from the selected organization
                </p>
              </div>
            )}
            
            {/* Token Status Warning */}
            {xeroState.isConnected && xeroState.connectionStatus === 'error' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Connection Issue Detected
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Your Xero connection may have expired. Please reconnect to ensure all features work properly.
                </p>
                <div className="mt-2">
                  <a 
                    href="/xero" 
                    className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Reconnect Xero
                  </a>
                </div>
              </div>
            )}
            
            {/* Token Expiry Status */}
            {tokenStatus && tokenStatus.status !== 'healthy' && (
              <div className={`mt-3 p-3 border rounded-md ${
                tokenStatus.status === 'expired' ? 'bg-red-50 border-red-200' :
                tokenStatus.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                tokenStatus.status === 'notice' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {tokenStatus.status === 'expired' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  {tokenStatus.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  {tokenStatus.status === 'notice' && <Clock className="w-4 h-4 text-blue-600" />}
                  <span className={`text-sm font-medium ${
                    tokenStatus.status === 'expired' ? 'text-red-800' :
                    tokenStatus.status === 'warning' ? 'text-yellow-800' :
                    tokenStatus.status === 'notice' ? 'text-blue-800' :
                    'text-gray-800'
                  }`}>
                    {tokenStatus.status === 'expired' && 'Token Expired'}
                    {tokenStatus.status === 'warning' && 'Token Expiring Soon'}
                    {tokenStatus.status === 'notice' && 'Token Status'}
                    {tokenStatus.status === 'no_tokens' && 'No Tokens Found'}
                    {tokenStatus.status === 'error' && 'Token Error'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  tokenStatus.status === 'expired' ? 'text-red-700' :
                  tokenStatus.status === 'warning' ? 'text-yellow-700' :
                  tokenStatus.status === 'notice' ? 'text-blue-700' :
                  'text-gray-700'
                }`}>
                  {tokenStatus.message}
                </p>
                {tokenStatus.needsReconnection && (
                  <div className="mt-2">
                    <button 
                      onClick={() => {
                        localStorage.removeItem('xero_authorized');
                        localStorage.removeItem('xero_auth_timestamp');
                        window.location.href = '/xero';
                      }}
                      className={`inline-flex items-center px-2 py-1 text-white text-xs rounded hover:opacity-90 transition-colors ${
                        tokenStatus.status === 'expired' ? 'bg-red-600 hover:bg-red-700' :
                        tokenStatus.status === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                        'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Reconnect Xero
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
            {config && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    Detection: {config.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    GST Threshold: {formatCurrency(config.gstThreshold)}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Link Expiry: {config.linkExpiryDays} days
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-600">Recent upload activity will appear here</p>
          </div>
        </div>
      )}

      {activeTab === 'config' && config && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuration Settings</h2>
          
          <div className="space-y-6">
            {/* General Settings */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Threshold (AUD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.gstThreshold}
                    onChange={(e) => handleConfigUpdate({ gstThreshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Transactions above this amount are flagged as high risk
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Expiry (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={config.linkExpiryDays}
                    onChange={(e) => handleConfigUpdate({ linkExpiryDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="smsEnabled"
                    checked={config.smsEnabled}
                    onChange={(e) => handleConfigUpdate({ smsEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">
                    Enable SMS Notifications
                  </label>
                </div>
                
                {config.smsEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={config.phoneNumber || ''}
                      onChange={(e) => handleConfigUpdate({ phoneNumber: e.target.value })}
                      placeholder="+61412345678 or 0412345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter phone number in international format (+61412345678) or national format (0412345678)
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={config.emailEnabled}
                    onChange={(e) => handleConfigUpdate({ emailEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">
                    Enable Email Notifications
                  </label>
                </div>
                
                {config.emailEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={config.emailAddress || ''}
                      onChange={(e) => handleConfigUpdate({ emailAddress: e.target.value })}
                      placeholder="notifications@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">System Status</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={config.enabled}
                  onChange={(e) => handleConfigUpdate({ enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Enable Missing Attachment Detection
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Missing Transactions</h2>
              <span className="text-sm text-gray-500">
                {missingTransactions.length} transactions found
              </span>
            </div>
          </div>
          
          {missingTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <FileX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No missing attachments found</p>
              <p className="text-sm text-gray-500">Click "Scan for Missing" to check for transactions without receipts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Potential Penalty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {missingTransactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.type} #{transaction.InvoiceID || transaction.BankTransactionID || transaction.ReceiptID || transaction.PurchaseOrderID}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.Date && formatDate(transaction.Date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(transaction.moneyAtRisk.total, transaction.moneyAtRisk.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.moneyAtRisk.riskLevel === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.moneyAtRisk.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.moneyAtRisk.potentialPenalty, transaction.moneyAtRisk.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload Links</h2>
              <div className="flex space-x-2">
                {['all', 'active', 'used', 'expired'].map((status) => (
                  <button
                    key={status}
                    onClick={() => loadUploadLinks(status as any)}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {uploadLinks.length === 0 ? (
            <div className="p-6 text-center">
              <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upload links found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadLinks.map((link) => (
                    <tr key={link.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {link.transactionType} #{link.transactionId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Link ID: {link.linkId.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {link.used ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Used
                          </span>
                        ) : new Date(link.expiresAt) < new Date() ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(link.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(link.expiresAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>
    </SidebarLayout>
  );
};

export default MissingAttachments;
