import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Divider,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useXero } from '../contexts/XeroContext';
import { useAuth } from '../contexts/AuthContext';
import BASProcessor from '../components/BASProcessor';
import FASProcessor from '../components/FASProcessor';

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

function a11yProps(index: number) {
  return {
    id: `xero-tab-${index}`,
    'aria-controls': `xero-tabpanel-${index}`,
  };
}

const EnhancedXeroFlow: React.FC = () => {
  const {
    status,
    isLoading,
    error,
    selectedTenant,
    availableTenants,
    selectTenant,
    connect,
    disconnect,
    checkConnection,
    refreshData,
    clearCache
  } = useXero();

  const { company } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshData();
      console.log('✅ Data refreshed successfully');
    } catch (error: any) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle tenant selection
  const handleTenantChange = (event: any) => {
    const tenantId = event.target.value;
    const tenant = availableTenants.find(t => t.tenantId === tenantId || t.id === tenantId);
    selectTenant(tenant || null);
  };

  // Handle settings dialog
  const handleSettingsOpen = () => setSettingsOpen(true);
  const handleSettingsClose = () => setSettingsOpen(false);

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      console.log('✅ Disconnected from Xero successfully');
    } catch (error: any) {
      console.error('❌ Error disconnecting:', error);
    }
  };

  // Render connection status card
  const renderConnectionStatus = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Xero Connection Status</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Connection">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={handleSettingsOpen}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={status.connected && status.isTokenValid ? <CheckCircleIcon /> : <ErrorIcon />}
                label={status.connected && status.isTokenValid ? 'Connected' : 'Not Connected'}
                color={status.connected && status.isTokenValid ? 'success' : 'error'}
                size="large"
              />
              {company && (
                <Chip
                  label={`Company: ${company.name}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {selectedTenant && (
              <FormControl fullWidth size="small">
                <InputLabel>Organization</InputLabel>
                <Select
                  value={selectedTenant.tenantId || selectedTenant.id || ''}
                  onChange={handleTenantChange}
                  label="Organization"
                >
                  {availableTenants.map((tenant) => (
                    <MenuItem key={tenant.tenantId || tenant.id} value={tenant.tenantId || tenant.id}>
                      {tenant.name || tenant.organizationName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
        </Grid>

        {/* Status Messages */}
        {status.message && (
          <Alert 
            severity={status.connected ? 'info' : 'warning'} 
            sx={{ mt: 2 }}
            icon={<InfoIcon />}
          >
            <Typography variant="body2">{status.message}</Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Connection Details */}
        {status.connected && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Token Status:</strong> {status.isTokenValid ? 'Valid' : 'Expired'}
            </Typography>
            {status.expiresAt && (
              <Typography variant="body2" color="text.secondary">
                <strong>Expires:</strong> {new Date(status.expiresAt).toLocaleString()}
              </Typography>
            )}
            {selectedTenant && (
              <Typography variant="body2" color="text.secondary">
                <strong>Selected Organization:</strong> {selectedTenant.name || selectedTenant.organizationName}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Render connection required state
  if (!status.connected) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Xero Integration
        </Typography>
        
        {renderConnectionStatus()}
        
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Connect to Xero to Access Your Data
              </Typography>
              <Typography>
                Connect your Xero account to process BAS (Business Activity Statements) and FAS (Fringe Benefits Tax) data.
                You'll be able to select from your available organizations and process compliance data automatically.
              </Typography>
            </Alert>
            
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={connect}
                disabled={isLoading}
                sx={{ minWidth: 200 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    Connecting...
                  </>
                ) : (
                  'Connect to Xero'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Render main interface
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Xero Integration
      </Typography>
      
      {renderConnectionStatus()}
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Xero integration tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="BAS Processing" {...a11yProps(0)} />
          <Tab label="FAS Processing" {...a11yProps(1)} />
        </Tabs>
        
        <TabPanel value={activeTab} index={0}>
          <BASProcessor />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <FASProcessor />
        </TabPanel>
      </Paper>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleSettingsClose} maxWidth="sm" fullWidth>
        <DialogTitle>Xero Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Connection Information
            </Typography>
            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Status:</strong> {status.connected ? 'Connected' : 'Not Connected'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Token Valid:</strong> {status.isTokenValid ? 'Yes' : 'No'}
              </Typography>
              {status.expiresAt && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Token Expires:</strong> {new Date(status.expiresAt).toLocaleString()}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                <strong>Available Organizations:</strong> {availableTenants.length}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Organizations
            </Typography>
            {availableTenants.length > 0 ? (
              <Box>
                {availableTenants.map((tenant, index) => (
                  <Box key={tenant.tenantId || tenant.id} sx={{ mb: 1 }}>
                    <Chip
                      label={tenant.name || tenant.organizationName}
                      variant={selectedTenant?.tenantId === tenant.tenantId ? 'filled' : 'outlined'}
                      color={selectedTenant?.tenantId === tenant.tenantId ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No organizations available
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Close</Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <CircularProgress size={16} /> : 'Refresh'}
          </Button>
          <Button onClick={handleDisconnect} color="error">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EnhancedXeroFlow;