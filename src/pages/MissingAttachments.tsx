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
  createUploadLink,
  uploadReceipt,
  getMissingAttachmentStatistics,
  checkTokenStatus,
  MissingAttachmentConfig,
  MissingTransaction,
  UploadLink,
  Statistics,
  TokenStatus
} from '../api/missingAttachmentService';
import { useXero } from '../contexts/XeroContext';

const CONFIG_COMPARISON_FIELDS: (keyof MissingAttachmentConfig)[] = [
  'gstThreshold',
  'linkExpiryDays',
  'smsEnabled',
  'phoneNumber',
  'emailEnabled',
  'emailAddress',
  'enabled',
  'notificationFrequency',
  'maxDailyNotifications',
];

const MissingAttachments: React.FC = () => {
  const { state: xeroState, refreshToken, selectTenant } = useXero();
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'transactions' | 'links'>('overview');
  const [config, setConfig] = useState<MissingAttachmentConfig | null>(null);
  const [configDraft, setConfigDraft] = useState<MissingAttachmentConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [missingTransactions, setMissingTransactions] = useState<MissingTransaction[]>([]);
  const [uploadLinks, setUploadLinks] = useState<UploadLink[]>([]);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const lastRefreshRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<MissingTransaction | null>(null);
  const [uploadLinkInfo, setUploadLinkInfo] = useState<UploadLink | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [creatingUploadLink, setCreatingUploadLink] = useState(false);

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
      setConfigDraft(configData);
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

  const getTransactionId = (transaction: MissingTransaction): string | null => {
    return (
      transaction.InvoiceID ||
      transaction.BankTransactionID ||
      transaction.ReceiptID ||
      transaction.PurchaseOrderID ||
      (transaction as any).TransactionID ||
      (transaction as any).transactionId ||
      null
    );
  };

  const getTransactionLabel = (transaction: MissingTransaction): string => {
    const id = getTransactionId(transaction);
    const label = transaction.type || 'Transaction';
    return id ? `${label} #${id}` : label;
  };

  useEffect(() => {
    if (!config) {
      setConfigDraft(null);
      return;
    }

    setConfigDraft((prev) => {
      if (!prev) {
        return { ...config };
      }

      const hasUnsavedChanges = CONFIG_COMPARISON_FIELDS.some(
        (field) => (prev?.[field] ?? null) !== (config?.[field] ?? null),
      );
      return hasUnsavedChanges ? prev : { ...config };
    });
  }, [config]);

  const updateConfigDraft = useCallback((field: keyof MissingAttachmentConfig, value: any) => {
    setConfigDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const configValidation = useMemo(() => {
    const errors: {
      gstThreshold?: string;
      linkExpiryDays?: string;
      phoneNumber?: string;
      emailAddress?: string;
    } = {};

    if (!configDraft) {
      return errors;
    }

    const gstThreshold = Number(configDraft.gstThreshold ?? 0);
    if (!Number.isFinite(gstThreshold) || gstThreshold < 0 || gstThreshold > 999999.99) {
      errors.gstThreshold = 'GST threshold must be between 0 and 999,999.99';
    }

    const linkExpiryDays = Number(configDraft.linkExpiryDays ?? 0);
    if (!Number.isInteger(linkExpiryDays) || linkExpiryDays < 1 || linkExpiryDays > 30) {
      errors.linkExpiryDays = 'Link expiry must be between 1 and 30 days';
    }

    if (configDraft.smsEnabled) {
      const phone = (configDraft.phoneNumber || '').trim();
      if (!phone) {
        errors.phoneNumber = 'Phone number is required when SMS notifications are enabled.';
      } else {
        const cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+')) {
          const digits = cleaned.substring(1);
          if (!/^\d{7,15}$/.test(digits)) {
            errors.phoneNumber = 'Enter a valid international phone number (+ followed by 7-15 digits).';
          }
        } else if (!/^\d{7,15}$/.test(cleaned)) {
          errors.phoneNumber = 'Enter a valid phone number with 7-15 digits.';
        }
      }
    }

    if (configDraft.emailEnabled) {
      const email = (configDraft.emailAddress || '').trim();
      if (!email) {
        errors.emailAddress = 'Email address is required when email notifications are enabled.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.emailAddress = 'Enter a valid email address.';
      }
    }

    return errors;
  }, [configDraft]);

  const hasValidationErrors = useMemo(
    () => Object.values(configValidation).some((message) => Boolean(message)),
    [configValidation],
  );

  const isConfigDirty = useMemo(() => {
    if (!configDraft || !config) {
      return false;
    }
    return CONFIG_COMPARISON_FIELDS.some(
      (field) => (configDraft?.[field] ?? null) !== (config?.[field] ?? null),
    );
  }, [configDraft, config]);

  const handleResetConfig = useCallback(() => {
    if (config) {
      setConfigDraft({ ...config });
    }
  }, [config]);

  const handleSaveConfig = useCallback(async () => {
    if (!configDraft) {
      return;
    }

    if (hasValidationErrors) {
      toast.error('Please fix the highlighted fields before saving.');
      return;
    }

    const updates: Partial<MissingAttachmentConfig> = {};
    CONFIG_COMPARISON_FIELDS.forEach((field) => {
      const draftValue = configDraft[field];
      const originalValue = config?.[field];
      const normalizedDraft =
        typeof draftValue === 'string'
          ? draftValue.trim()
          : draftValue;

      if (normalizedDraft !== originalValue) {
        (updates as any)[field] = normalizedDraft;
      }
    });

    if (Object.keys(updates).length === 0) {
      toast('No changes to save.');
      return;
    }

    try {
      setSavingConfig(true);
      const updatedConfig = await updateMissingAttachmentConfig(updates);
      setConfig(updatedConfig);
      toast.success('Configuration updated successfully');
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    } finally {
      setSavingConfig(false);
    }
  }, [configDraft, config, hasValidationErrors]);

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
      
      const result = await processMissingAttachments(activeTenantId || undefined);
      const notificationCount = result.notifications?.totalNotifications ?? result.smssSent;
      toast.success(`Processed ${result.totalTransactions} transactions, sent ${notificationCount} notifications`);
      
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
          const result = await processMissingAttachments(activeTenantId || undefined);
          const notificationCount = result.notifications?.totalNotifications ?? result.smssSent;
          toast.success(`Processed ${result.totalTransactions} transactions, sent ${notificationCount} notifications`);
          
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
          const result = await processMissingAttachments(activeTenantId || undefined);
          const notificationCount = result.notifications?.totalNotifications ?? result.smssSent;
          toast.success(`Processed ${result.totalTransactions} transactions, sent ${notificationCount} notifications`);
          
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

  const handleCloseUploadModal = useCallback(() => {
    setUploadModalOpen(false);
    setUploadTarget(null);
    setUploadLinkInfo(null);
    setUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUploadFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadFile(file);
  }, []);

  const handleOpenUploadModal = useCallback(
    async (transaction: MissingTransaction) => {
      const tenantId = activeTenantId;
      if (!tenantId) {
        toast.error('Select a Xero organization before uploading receipts.');
        return;
      }

      const transactionId = getTransactionId(transaction);
      if (!transactionId) {
        toast.error('Unable to determine the transaction identifier.');
        return;
      }

      try {
        setCreatingUploadLink(true);
        setUploadTarget(transaction);
        setUploadLinkInfo(null);
        setUploadFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        const link = await createUploadLink({
          transactionId,
          tenantId,
          transactionType: transaction.type || 'Invoice',
        });

        setUploadLinkInfo(link);
        setUploadModalOpen(true);
        toast.success('Upload link ready. Select a file to attach.');
      } catch (error: any) {
        console.error('Error creating upload link:', error);
        const message = error.response?.data?.message || error.message || 'Failed to create upload link';
        toast.error(message);
        setUploadTarget(null);
      } finally {
        setCreatingUploadLink(false);
      }
    },
    [activeTenantId],
  );

  const handleUploadReceipt = useCallback(async () => {
    if (!uploadLinkInfo || !uploadTarget) {
      toast.error('Upload link not ready. Please try again.');
      return;
    }

    if (!uploadFile) {
      toast.error('Select a file to upload.');
      return;
    }

    const transactionId = getTransactionId(uploadTarget);

    try {
      setUploadingReceipt(true);
      await uploadReceipt(uploadLinkInfo.linkId, uploadLinkInfo.token, uploadFile);
      toast.success('Receipt uploaded successfully.');

      if (transactionId) {
        setMissingTransactions((prev) =>
          prev.filter((transaction) => getTransactionId(transaction) !== transactionId),
        );
      }

      await loadUploadLinks();
      handleCloseUploadModal();
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      const message = error.response?.data?.message || error.message || 'Failed to upload receipt';
      toast.error(message);
    } finally {
      setUploadingReceipt(false);
    }
  }, [handleCloseUploadModal, loadUploadLinks, uploadFile, uploadLinkInfo, uploadTarget]);

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

      {activeTab === 'config' && config && configDraft && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configuration Settings</h2>
              <p className="text-sm text-gray-500">
                Update your notification preferences, then click Save to apply changes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetConfig}
                disabled={!isConfigDirty || savingConfig}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={!isConfigDirty || hasValidationErrors || savingConfig}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {savingConfig ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

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
                    value={configDraft.gstThreshold}
                    onChange={(e) => {
                      const next = Number.parseFloat(e.target.value);
                      updateConfigDraft(
                        'gstThreshold',
                        Number.isNaN(next) ? configDraft.gstThreshold : next,
                      );
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Transactions above this amount are flagged as high risk
                  </p>
                  {configValidation.gstThreshold && (
                    <p className="text-xs text-red-600 mt-1">{configValidation.gstThreshold}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Expiry (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={configDraft.linkExpiryDays}
                    onChange={(e) => {
                      const next = Number.parseInt(e.target.value, 10);
                      updateConfigDraft(
                        'linkExpiryDays',
                        Number.isNaN(next) ? configDraft.linkExpiryDays : next,
                      );
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {configValidation.linkExpiryDays && (
                    <p className="text-xs text-red-600 mt-1">{configValidation.linkExpiryDays}</p>
                  )}
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
                    checked={configDraft.smsEnabled}
                    onChange={(e) => updateConfigDraft('smsEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">
                    Enable SMS Notifications
                  </label>
                </div>

                {configDraft.smsEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      pattern="^[+0-9\s-]{7,20}$"
                      maxLength={20}
                      value={configDraft.phoneNumber || ''}
                      onChange={(e) => updateConfigDraft('phoneNumber', e.target.value)}
                      placeholder="+61412345678 or 0412345678"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        configValidation.phoneNumber
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter phone number in international format (+61412345678) or national format (0412345678)
                    </p>
                    {configValidation.phoneNumber && (
                      <p className="text-xs text-red-600 mt-1">{configValidation.phoneNumber}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={configDraft.emailEnabled}
                    onChange={(e) => updateConfigDraft('emailEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">
                    Enable Email Notifications
                  </label>
                </div>

                {configDraft.emailEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={configDraft.emailAddress || ''}
                      onChange={(e) => updateConfigDraft('emailAddress', e.target.value)}
                      placeholder="notifications@company.com"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        configValidation.emailAddress
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {configValidation.emailAddress && (
                      <p className="text-xs text-red-600 mt-1">{configValidation.emailAddress}</p>
                    )}
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
                  checked={configDraft.enabled}
                  onChange={(e) => updateConfigDraft('enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Enable Missing Attachment Detection
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                When disabled, missing attachment detection and notifications will be paused.
              </p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {missingTransactions.map((transaction, index) => {
                    const transactionId = getTransactionId(transaction);
                    const isTarget =
                      transactionId &&
                      uploadTarget &&
                      getTransactionId(uploadTarget) === transactionId;
                    const isBusy = isTarget && (creatingUploadLink || uploadingReceipt);

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getTransactionLabel(transaction)}
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
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.moneyAtRisk.riskLevel === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {transaction.moneyAtRisk.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(transaction.moneyAtRisk.potentialPenalty, transaction.moneyAtRisk.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => handleOpenUploadModal(transaction)}
                            disabled={isBusy || creatingUploadLink || uploadingReceipt || !activeTenantId}
                            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isTarget && uploadingReceipt
                              ? 'Uploading…'
                              : isTarget && creatingUploadLink
                              ? 'Preparing…'
                              : 'Upload Receipt'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
      {uploadModalOpen && uploadTarget && uploadLinkInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Upload Receipt</h3>
            <p className="text-sm text-gray-600 mt-1">
              Attach a document for {getTransactionLabel(uploadTarget)}.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Files are automatically linked to the Xero transaction and stored securely.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadFileChange}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, JPG, PNG. Max size 10MB.</p>
            </div>

            {uploadFile && (
              <p className="text-xs text-gray-600 mt-3">
                Selected file: <span className="font-medium">{uploadFile.name}</span>
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseUploadModal}
                disabled={uploadingReceipt}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadReceipt}
                disabled={!uploadFile || uploadingReceipt}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {uploadingReceipt ? 'Uploading…' : 'Upload to Xero'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
};

export default MissingAttachments;
