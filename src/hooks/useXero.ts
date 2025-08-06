import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';
import {
  getXeroAuthUrl,
  handleXeroCallback,
  getXeroCompanyInfo,
  refreshXeroToken,
  getXeroData,
  saveXeroSettings,
  getXeroSettings,
  deleteXeroSettings,
  getAllXeroSettings,
  type XeroTokens,
  type XeroTenant,
  type XeroCompanyInfo,
  type XeroResourceType,
  type XeroSettings,
} from '../api/xeroService';
import toast from 'react-hot-toast';

interface UseXeroReturn {
  // State
  tokens: XeroTokens | null;
  tenants: XeroTenant[];
  selectedTenant: XeroTenant | null;
  companyInfo: XeroCompanyInfo | null;
  settings: XeroSettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  loadData: (resourceType: XeroResourceType) => Promise<any>;
  selectTenant: (tenantId: string) => void;
  loadCompanyInfo: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: { clientId: string; clientSecret: string; redirectUri: string }) => Promise<void>;
  deleteSettings: () => Promise<void>;
  
  // Computed
  isConnected: boolean;
  canAccess: boolean;
  hasSettings: boolean;
}

export const useXero = (): UseXeroReturn => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  const [tokens, setTokens] = useState<XeroTokens | null>(null);
  const [tenants, setTenants] = useState<XeroTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<XeroTenant | null>(null);
  const [companyInfo, setCompanyInfo] = useState<XeroCompanyInfo | null>(null);
  const [settings, setSettings] = useState<XeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!tokens;
  const canAccess = !company?.superadmin && companyInfo?.isEnrolled;
  const hasSettings = !!settings;
  
  // Debug logging
  console.log('useXero hook state:', { 
    hasSettings, 
    settings: !!settings, 
    settingsData: settings,
    isConnected,
    canAccess 
  });

  const startAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { authUrl } = await getXeroAuthUrl();
      window.location.href = authUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to start Xero authorization';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await handleXeroCallback(code, state);
      
      setTokens(result.tokens);
      setTenants(result.tenants);
      setSelectedTenant(result.tenants[0] || null);
      
      toast.success('Xero integration successful!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to complete Xero authorization';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken || !company?.id) return;

    try {
      const newTokens = await refreshXeroToken(tokens.refreshToken, company.id);
      setTokens(newTokens);
      toast.success('Token refreshed successfully');
    } catch (err: any) {
      toast.error('Failed to refresh token');
    }
  }, [tokens?.refreshToken, company?.id]);

  const loadData = useCallback(async (resourceType: XeroResourceType) => {
    if (!tokens?.accessToken || !selectedTenant) {
      throw new Error('Not connected to Xero');
    }

    const data = await getXeroData(resourceType, tokens.accessToken, selectedTenant.id);
    return data.data;
  }, [tokens?.accessToken, selectedTenant]);

  const selectTenant = useCallback((tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setSelectedTenant(tenant || null);
  }, [tenants]);

  const loadCompanyInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const info = await getXeroCompanyInfo();
      setCompanyInfo(info);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load company information';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      console.log('Loading Xero settings...');
      setIsLoading(true);
      setError(null);
      
      const settingsData = await getXeroSettings();
      console.log('Settings loaded:', settingsData);
      setSettings(settingsData);
    } catch (err: any) {
      console.log('Settings load error:', err.response?.status, err.response?.data);
      // Settings not found is not an error, just means not configured
      if (err.response?.status !== 404) {
        const errorMessage = err.response?.data?.message || 'Failed to load Xero settings';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (settingsData: { clientId: string; clientSecret: string; redirectUri: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const savedSettings = await saveXeroSettings(settingsData);
      setSettings(savedSettings);
      toast.success('Xero settings saved successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save Xero settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteXeroSettings();
      setSettings(null);
      toast.success('Xero settings deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Xero settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    tokens,
    tenants,
    selectedTenant,
    companyInfo,
    settings,
    isLoading,
    error,
    
    // Actions
    startAuth,
    handleCallback,
    refreshToken,
    loadData,
    selectTenant,
    loadCompanyInfo,
    loadSettings,
    saveSettings,
    deleteSettings,
    
    // Computed
    isConnected,
    canAccess,
    hasSettings,
  };
}; 