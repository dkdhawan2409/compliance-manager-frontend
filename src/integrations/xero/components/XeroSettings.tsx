// Xero Settings Component
// Comprehensive settings management for Xero integration

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Save,
  Delete,
  Visibility,
  VisibilityOff,
  TestTube,
  CheckCircle,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';
import { useXero } from '../context/XeroProvider';
import { XeroSettingsProps, XeroSettings as XeroSettingsType } from '../types';

export const XeroSettings: React.FC<XeroSettingsProps> = ({
  onSettingsChange,
  onSave,
  className = '',
  showAdvanced = false,
}) => {
  const { state, saveSettings, deleteSettings, refreshConnection, clearError } = useXero();
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  });
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { settings, isLoading, error, isConnected } = state;

  useEffect(() => {
    if (settings) {
      setFormData({
        clientId: settings.clientId || '',
        clientSecret: '', // Don't show existing secret for security
        redirectUri: settings.redirectUri || '',
      });
    }
  }, [settings]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // Clear test result when settings change
    setTestResult(null);
    clearError();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setTestResult(null);

      const settingsToSave: Partial<XeroSettingsType> = {
        clientId: formData.clientId,
        redirectUri: formData.redirectUri,
      };

      // Only include client secret if it's been entered
      if (formData.clientSecret) {
        (settingsToSave as any).clientSecret = formData.clientSecret;
      }

      await saveSettings(settingsToSave);
      onSave?.(settingsToSave as XeroSettingsType);
      onSettingsChange?.(settingsToSave as XeroSettingsType);
      
      // Refresh connection status after saving
      await refreshConnection();
    } catch (err: any) {
      console.error('❌ Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSettings();
      setFormData({
        clientId: '',
        clientSecret: '',
        redirectUri: '',
      });
      setDeleteDialogOpen(false);
    } catch (err: any) {
      console.error('❌ Failed to delete settings:', err);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Test the connection by trying to get connection status
      await refreshConnection();
      
      setTestResult({
        success: true,
        message: 'Settings are valid and connection test successful',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const isFormValid = formData.clientId && formData.redirectUri;

  return (
    <div className={`xero-settings ${className}`}>
      <Card>
        <CardContent>
          <Typography variant="h5" className="mb-4">
            Xero Integration Settings
          </Typography>

          {/* Connection Status */}
          {isConnected && (
            <Alert severity="success" className="mb-4">
              <CheckCircle className="mr-2" />
              Xero is connected and ready to use
            </Alert>
          )}

          {error && (
            <Alert severity="error" className="mb-4">
              <ErrorIcon className="mr-2" />
              {error}
            </Alert>
          )}

          {/* Settings Form */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client ID"
                value={formData.clientId}
                onChange={handleInputChange('clientId')}
                placeholder="Enter your Xero Client ID"
                helperText="Get this from your Xero app configuration"
                required
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Secret"
                type={showClientSecret ? 'text' : 'password'}
                value={formData.clientSecret}
                onChange={handleInputChange('clientSecret')}
                placeholder={settings?.clientId ? 'Enter new client secret (leave blank to keep existing)' : 'Enter your Xero Client Secret'}
                helperText="Keep this secure and never share it"
                disabled={saving}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowClientSecret(!showClientSecret)}
                        edge="end"
                      >
                        {showClientSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Redirect URI"
                value={formData.redirectUri}
                onChange={handleInputChange('redirectUri')}
                placeholder="https://yourdomain.com/xero-callback"
                helperText="This must match the redirect URI in your Xero app configuration"
                required
                disabled={saving}
              />
            </Grid>
          </Grid>

          {/* Advanced Options */}
          <Box className="mt-4">
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvancedOptions}
                  onChange={(e) => setShowAdvancedOptions(e.target.checked)}
                />
              }
              label="Show Advanced Options"
            />
          </Box>

          {showAdvancedOptions && (
            <Box className="mt-4 p-4 bg-gray-50 rounded">
              <Typography variant="h6" className="mb-3">
                Advanced Configuration
              </Typography>
              
              <Alert severity="info" className="mb-3">
                <Info className="mr-2" />
                Advanced settings are typically configured automatically. Only modify if you understand the implications.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="API Base URL"
                    value="/api/xero"
                    disabled
                    helperText="Backend API endpoint"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Environment"
                    value="Production"
                    disabled
                    helperText="Xero API environment"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Test Result */}
          {testResult && (
            <Alert 
              severity={testResult.success ? 'success' : 'error'} 
              className="mt-4"
            >
              {testResult.success ? <CheckCircle className="mr-2" /> : <ErrorIcon className="mr-2" />}
              {testResult.message}
            </Alert>
          )}

          <Divider className="my-4" />

          {/* Action Buttons */}
          <Box className="flex gap-3 flex-wrap">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isFormValid || saving || isLoading}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testing || !isFormValid || isLoading}
              startIcon={testing ? <CircularProgress size={20} /> : <TestTube />}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            {settings && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={saving || isLoading}
                startIcon={<Delete />}
              >
                Delete Settings
              </Button>
            )}
          </Box>

          {/* Help Information */}
          <Box className="mt-6 p-4 bg-blue-50 rounded">
            <Typography variant="h6" className="mb-2">
              Need Help?
            </Typography>
            <Typography variant="body2" className="mb-2">
              To set up Xero integration:
            </Typography>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Create a Xero app at <a href="https://developer.xero.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">developer.xero.com</a></li>
              <li>Configure your redirect URI to match the one above</li>
              <li>Copy your Client ID and Client Secret</li>
              <li>Save the settings and test the connection</li>
              <li>Use the Connect button to authorize your Xero account</li>
            </ol>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Xero Settings
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your Xero integration settings? 
            This will disconnect your Xero account and you'll need to reconfigure the integration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={saving}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
