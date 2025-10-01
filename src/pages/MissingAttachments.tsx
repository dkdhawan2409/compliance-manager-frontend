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
  MissingAttachmentConfig,
  MissingTransaction,
  UploadLink,
  Statistics
} from '../api/missingAttachmentService';
import { useXero } from '../integrations/xero/context/XeroProvider';

const MissingAttachments: React.FC = () => {
  const { state: xeroState } = useXero();
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'transactions' | 'links'>('overview');
  const [config, setConfig] = useState<MissingAttachmentConfig | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [missingTransactions, setMissingTransactions] = useState<MissingTransaction[]>([]);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const lastRefreshRef = useRef<number>(0);

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
      const [configData, statsData] = await Promise.all([
        getMissingAttachmentConfig(),
        getMissingAttachmentStatistics(30)
      ]);
      
      setConfig(configData);
      setStatistics(statsData);
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
      const result = await detectMissingAttachments();
      setMissingTransactions(result.transactions);
      toast.success(`Found ${result.totalTransactions} transactions without attachments`);
    } catch (error: any) {
      console.error('Error detecting missing attachments:', error);
      
      // Show specific error messages for Xero connection issues
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage.includes('Xero not connected') || errorMessage.includes('access token not found')) {
        toast.error('Xero not connected. Please go to Xero Flow and connect your account first.');
      } else if (errorMessage.includes('refresh token has expired') || errorMessage.includes('Please reconnect to Xero Flow')) {
        toast.error('Xero connection expired. Please reconnect to Xero Flow to continue.', {
          duration: 8000,
          action: {
            label: 'Go to Xero Flow',
            onClick: () => window.open('/xero', '_blank')
          }
        });
      } else if (errorMessage.includes('token expired')) {
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
        toast.error(`Failed to detect missing attachments: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProcessMissing = useCallback(async () => {
    try {
      setProcessing(true);
      const result = await processMissingAttachments();
      toast.success(`Processed ${result.totalTransactions} transactions, sent ${result.smssSent} notifications`);
      
      // Refresh data
      await loadData();
      await loadUploadLinks();
    } catch (error: any) {
      console.error('Error processing missing attachments:', error);
      
      // Show specific error messages for Xero connection issues
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage.includes('refresh token has expired') || errorMessage.includes('Please reconnect to Xero Flow')) {
        toast.error('Xero connection expired. Please reconnect to Xero Flow to continue.', {
          duration: 8000,
          action: {
            label: 'Go to Xero Flow',
            onClick: () => window.open('/xero', '_blank')
          }
        });
      } else if (errorMessage.includes('token expired')) {
        toast.error('Xero token expired. Please reconnect to Xero.', {
          duration: 6000,
          action: {
            label: 'Reconnect',
            onClick: () => window.open('/xero', '_blank')
          }
        });
      } else {
        toast.error(`Failed to process missing attachments: ${errorMessage}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [loadData]);

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
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan for Missing</span>
          </button>
          <button
            onClick={handleProcessMissing}
            disabled={processing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
