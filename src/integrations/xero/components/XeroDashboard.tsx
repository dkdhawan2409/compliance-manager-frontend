// Xero Dashboard Component
// Comprehensive dashboard showing Xero data overview and key metrics

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  Receipt, 
  AccountBalance,
  Refresh,
  TrendingDown,
  AttachMoney,
} from '@mui/icons-material';
import { useXero } from '../context/XeroProvider';
import { XeroDashboardProps, XeroDashboardData } from '../types';

export const XeroDashboard: React.FC<XeroDashboardProps> = ({
  tenantId,
  showSummary = true,
  showRecentData = true,
  className = '',
  onDataLoad,
}) => {
  const { state, loadData, refreshConnection, selectTenant } = useXero();
  const [dashboardData, setDashboardData] = useState<XeroDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, tenants, selectedTenant, isLoading } = state;

  useEffect(() => {
    if (isConnected && (tenantId || selectedTenant)) {
      loadDashboardData();
    }
  }, [isConnected, tenantId, selectedTenant]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const targetTenantId = tenantId || selectedTenant?.id;
      if (!targetTenantId) {
        throw new Error('No tenant selected');
      }

      const response = await loadData({
        resourceType: 'dashboard-data',
        tenantId: targetTenantId,
      });

      if (response.success && response.data) {
        setDashboardData(response.data);
        onDataLoad?.(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('❌ Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleTenantChange = (tenantId: string) => {
    selectTenant(tenantId);
  };

  if (!isConnected) {
    return (
      <Card className={`xero-dashboard ${className}`}>
        <CardContent>
          <Alert severity="info" className="mb-4">
            Connect to Xero to view your dashboard
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading || isLoading) {
    return (
      <Card className={`xero-dashboard ${className}`}>
        <CardContent className="flex justify-center items-center py-8">
          <CircularProgress />
          <Typography variant="body1" className="ml-3">
            Loading dashboard data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`xero-dashboard ${className}`}>
        <CardContent>
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
          <Button 
            variant="outlined" 
            onClick={handleRefresh}
            startIcon={<Refresh />}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card className={`xero-dashboard ${className}`}>
        <CardContent>
          <Alert severity="warning">
            No dashboard data available
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { summary, organization } = dashboardData;

  return (
    <div className={`xero-dashboard ${className}`}>
      {/* Tenant Selection */}
      {tenants && tenants.length > 1 && (
        <Card className="mb-4">
          <CardContent>
            <Typography variant="h6" className="mb-2">
              Select Organization
            </Typography>
            <div className="flex flex-wrap gap-2">
              {tenants.map((tenant) => (
                <Chip
                  key={tenant.id}
                  label={tenant.name || tenant.organizationName}
                  onClick={() => handleTenantChange(tenant.id)}
                  color={selectedTenant?.id === tenant.id ? 'primary' : 'default'}
                  variant={selectedTenant?.id === tenant.id ? 'filled' : 'outlined'}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Info */}
      {organization && (
        <Card className="mb-4">
          <CardContent>
            <Typography variant="h5" className="mb-2">
              {organization.Name || organization.LegalName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {organization.OrganisationEntityType} • {organization.CountryCode} • {organization.BaseCurrency}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {showSummary && (
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <div>
                    <Typography variant="h6" className="text-green-600">
                      ${summary.totalAmount || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </div>
                  <TrendingUp className="text-green-600 text-3xl" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <div>
                    <Typography variant="h6" className="text-blue-600">
                      {summary.totalInvoices}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Invoices
                    </Typography>
                  </div>
                  <Receipt className="text-blue-600 text-3xl" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <div>
                    <Typography variant="h6" className="text-purple-600">
                      {summary.totalContacts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Contacts
                    </Typography>
                  </div>
                  <People className="text-purple-600 text-3xl" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <div>
                    <Typography variant="h6" className="text-orange-600">
                      {summary.totalAccounts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chart of Accounts
                    </Typography>
                  </div>
                  <AccountBalance className="text-orange-600 text-3xl" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Payment Status */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" className="text-green-600">
                    {summary.paidInvoices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Invoices
                  </Typography>
                </div>
                <AttachMoney className="text-green-600 text-3xl" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" className="text-red-600">
                    {summary.overdueInvoices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Invoices
                  </Typography>
                </div>
                <TrendingDown className="text-red-600 text-3xl" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Data */}
      {showRecentData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" className="mb-3">
                  Recent Invoices
                </Typography>
                {dashboardData.recentInvoices && dashboardData.recentInvoices.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.recentInvoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.InvoiceID} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <Typography variant="body2" className="font-medium">
                            {invoice.InvoiceNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invoice.Contact?.Name}
                          </Typography>
                        </div>
                        <Typography variant="body2" className="font-medium">
                          ${invoice.Total}
                        </Typography>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent invoices
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" className="mb-3">
                  Recent Contacts
                </Typography>
                {dashboardData.recentContacts && dashboardData.recentContacts.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.recentContacts.slice(0, 5).map((contact) => (
                      <div key={contact.ContactID} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <Typography variant="body2" className="font-medium">
                            {contact.Name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contact.EmailAddress}
                          </Typography>
                        </div>
                        <Chip 
                          label={contact.ContactStatus} 
                          size="small"
                          color={contact.ContactStatus === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent contacts
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Refresh Button */}
      <Box className="mt-4 text-center">
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          startIcon={<Refresh />}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>
    </div>
  );
};
