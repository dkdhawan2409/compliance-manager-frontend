import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Alert, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Fade,
  Slide
} from '@mui/material';
import {
  CloudSync,
  Business,
  Settings,
  Refresh,
  Add,
  CheckCircle,
  Error,
  Warning,
  Info,
  AdminPanelSettings
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface CompanyXeroStatus {
  id: number;
  name: string;
  createdAt: string;
  xeroSettings: {
    hasSettings: boolean;
    hasCredentials: boolean;
    hasValidTokens: boolean;
    isConnected: boolean;
    tenantId?: string;
    lastUpdated?: string;
    createdAt?: string;
  };
}

interface XeroStats {
  totalCompanies: number;
  withSettings: number;
  withCredentials: number;
  connected: number;
  withoutSettings: number;
}

const SuperAdminXeroManagement: React.FC = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyXeroStatus[]>([]);
  const [stats, setStats] = useState<XeroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLinking, setAutoLinking] = useState(false);
  const [autoLinkDialog, setAutoLinkDialog] = useState(false);
  const [xeroSettings, setXeroSettings] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadCompaniesStatus();
    }
  }, [isSuperAdmin]);

  const loadCompaniesStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/xero-plug-play/admin/companies-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load companies status');
      }

      const data = await response.json();
      setCompanies(data.data.companies);
      setStats(data.data.stats);
    } catch (error) {
      console.error('Error loading companies status:', error);
      toast.error('Failed to load companies status');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLinkToAll = async () => {
    if (!xeroSettings.clientId || !xeroSettings.clientSecret || !xeroSettings.redirectUri) {
      toast.error('Please fill in all Xero settings fields');
      return;
    }

    try {
      setAutoLinking(true);
      const response = await fetch('/api/xero-plug-play/admin/auto-link-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(xeroSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to auto-link settings');
      }

      const data = await response.json();
      toast.success(data.message);
      setAutoLinkDialog(false);
      setXeroSettings({ clientId: '', clientSecret: '', redirectUri: '' });
      loadCompaniesStatus(); // Refresh the data
    } catch (error) {
      console.error('Error auto-linking settings:', error);
      toast.error('Failed to auto-link settings to all companies');
    } finally {
      setAutoLinking(false);
    }
  };

  const getStatusChip = (company: CompanyXeroStatus) => {
    if (company.xeroSettings.isConnected) {
      return <Chip icon={<CheckCircle />} label="Connected" color="success" size="small" />;
    } else if (company.xeroSettings.hasCredentials) {
      return <Chip icon={<Warning />} label="Not Connected" color="warning" size="small" />;
    } else if (company.xeroSettings.hasSettings) {
      return <Chip icon={<Error />} label="Invalid Settings" color="error" size="small" />;
    } else {
      return <Chip icon={<Info />} label="No Settings" color="default" size="small" />;
    }
  };

  if (!isSuperAdmin) {
    return (
      <SidebarLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Access denied. Super admin privileges required.
          </Alert>
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            borderRadius: 3,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <AdminPanelSettings sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Super Admin - Xero Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage Xero integration settings across all companies
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Stats Cards */}
        {stats && (
          <Slide direction="up" in timeout={1000}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Business sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.totalCompanies}
                        </Typography>
                        <Typography variant="body2">Total Companies</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Settings sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.withSettings}
                        </Typography>
                        <Typography variant="body2">With Settings</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CloudSync sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.connected}
                        </Typography>
                        <Typography variant="body2">Connected</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Warning sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.withoutSettings}
                        </Typography>
                        <Typography variant="body2">Without Settings</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Slide>
        )}

        {/* Action Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAutoLinkDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            Auto-Link to All Companies
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCompaniesStatus}
            disabled={loading}
          >
            Refresh Status
          </Button>
        </Box>

        {/* Companies Table */}
        <Slide direction="up" in timeout={1200}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business />
                Companies Xero Status
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Company Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Has Credentials</TableCell>
                        <TableCell>Has Valid Tokens</TableCell>
                        <TableCell>Last Updated</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {company.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(company)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={company.xeroSettings.hasCredentials ? 'Yes' : 'No'} 
                              color={company.xeroSettings.hasCredentials ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={company.xeroSettings.hasValidTokens ? 'Yes' : 'No'} 
                              color={company.xeroSettings.hasValidTokens ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {company.xeroSettings.lastUpdated ? 
                              new Date(company.xeroSettings.lastUpdated).toLocaleDateString() : 
                              'Never'
                            }
                          </TableCell>
                          <TableCell>
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Slide>

        {/* Auto-Link Dialog */}
        <Dialog open={autoLinkDialog} onClose={() => setAutoLinkDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Auto-Link Xero Settings to All Companies
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This will apply the same Xero settings to all companies. Existing settings will be updated.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Client ID"
                value={xeroSettings.clientId}
                onChange={(e) => setXeroSettings({ ...xeroSettings, clientId: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Client Secret"
                type="password"
                value={xeroSettings.clientSecret}
                onChange={(e) => setXeroSettings({ ...xeroSettings, clientSecret: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Redirect URI"
                value={xeroSettings.redirectUri}
                onChange={(e) => setXeroSettings({ ...xeroSettings, redirectUri: e.target.value })}
                fullWidth
                required
                helperText="e.g., https://yourdomain.com/xero-callback"
              />
            </Box>
            
            {autoLinking && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  Applying settings to all companies...
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAutoLinkDialog(false)} disabled={autoLinking}>
              Cancel
            </Button>
            <Button 
              onClick={handleAutoLinkToAll} 
              variant="contained"
              disabled={autoLinking}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                }
              }}
            >
              {autoLinking ? 'Applying...' : 'Apply to All Companies'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
};

export default SuperAdminXeroManagement;
