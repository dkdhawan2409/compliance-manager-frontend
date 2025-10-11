import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { withXeroData, XeroDataProps } from '../hocs/withXeroData';
import { useAuth } from '../contexts/AuthContext';

interface BASProcessorProps extends XeroDataProps {
  // Additional props specific to BAS processing
  onBASComplete?: (data: any) => void;
  onBASError?: (error: string) => void;
}

interface BASCalculationResult {
  totalSales: number;
  totalPurchases: number;
  gstOnSales: number;
  gstOnPurchases: number;
  netGST: number;
  period: {
    fromDate: string;
    toDate: string;
  };
  lastUpdated: string;
}

const BASProcessor: React.FC<BASProcessorProps> = ({
  // Xero data props
  isConnected,
  isTokenValid,
  connectionError,
  isLoading,
  selectedTenant,
  availableTenants,
  onTenantSelect,
  xeroData,
  dataLoading,
  dataError,
  connectToXero,
  disconnectFromXero,
  refreshConnection,
  loadXeroData,
  clearCache,
  // BAS specific props
  onBASComplete,
  onBASError
}) => {
  // State
  const [basData, setBasData] = useState<any>(null);
  const [calculationResult, setCalculationResult] = useState<BASCalculationResult | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [useCache, setUseCache] = useState(true);

  const { company } = useAuth();

  // Initialize date range (current quarter)
  useEffect(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);

    setFromDate(quarterStart.toISOString().split('T')[0]);
    setToDate(quarterEnd.toISOString().split('T')[0]);
  }, []);

  // Load BAS data when tenant or dates change
  const loadBASData = useCallback(async () => {
    if (!selectedTenant || !fromDate || !toDate) {
      return;
    }

    try {
      setCalculationError(null);
      console.log(`📊 Loading BAS data for ${selectedTenant.name} from ${fromDate} to ${toDate}`);
      
      const data = await loadXeroData('basData', {
        fromDate,
        toDate,
        useCache
      });

      setBasData(data);
      console.log('✅ BAS data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading BAS data:', error);
      setCalculationError(error.message || 'Failed to load BAS data');
      onBASError?.(error.message || 'Failed to load BAS data');
    }
  }, [selectedTenant, fromDate, toDate, useCache, loadXeroData, onBASError]);

  // Calculate BAS
  const calculateBAS = useCallback(async () => {
    if (!basData) {
      setCalculationError('No BAS data available. Please load data first.');
      return;
    }

    try {
      setIsCalculating(true);
      setCalculationError(null);
      
      console.log('🧮 Calculating BAS...');

      // Extract relevant data from BAS response
      const reports = basData.Reports || [];
      const basReport = reports.find((report: any) => report.ReportType === 'BAS');
      
      if (!basReport) {
        throw new Error('BAS report not found in Xero data');
      }

      // Extract values from BAS report rows
      const rows = basReport.Rows || [];
      let totalSales = 0;
      let totalPurchases = 0;
      let gstOnSales = 0;
      let gstOnPurchases = 0;

      // Process BAS report rows
      rows.forEach((row: any) => {
        if (row.Cells && row.Cells.length > 0) {
          const cells = row.Cells;
          const description = cells[0]?.Value || '';
          const value = parseFloat(cells[cells.length - 1]?.Value || '0');

          // Map BAS line items
          if (description.includes('Sales') && description.includes('GST')) {
            totalSales += Math.abs(value);
          } else if (description.includes('Purchases') && description.includes('GST')) {
            totalPurchases += Math.abs(value);
          } else if (description.includes('GST') && description.includes('Sales')) {
            gstOnSales += Math.abs(value);
          } else if (description.includes('GST') && description.includes('Purchases')) {
            gstOnPurchases += Math.abs(value);
          }
        }
      });

      const netGST = gstOnSales - gstOnPurchases;

      const result: BASCalculationResult = {
        totalSales,
        totalPurchases,
        gstOnSales,
        gstOnPurchases,
        netGST,
        period: {
          fromDate,
          toDate
        },
        lastUpdated: new Date().toISOString()
      };

      setCalculationResult(result);
      onBASComplete?.(result);
      
      console.log('✅ BAS calculation completed successfully');
    } catch (error: any) {
      console.error('❌ Error calculating BAS:', error);
      const errorMessage = error.message || 'Failed to calculate BAS';
      setCalculationError(errorMessage);
      onBASError?.(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, [basData, fromDate, toDate, onBASComplete, onBASError]);

  // Auto-load data when dependencies change
  useEffect(() => {
    if (selectedTenant && fromDate && toDate && isConnected && isTokenValid) {
      loadBASData();
    }
  }, [selectedTenant, fromDate, toDate, isConnected, isTokenValid, loadBASData]);

  // Auto-calculate when data changes
  useEffect(() => {
    if (basData && !calculationResult) {
      calculateBAS();
    }
  }, [basData, calculationResult, calculateBAS]);

  // Handle tenant selection
  const handleTenantChange = (event: any) => {
    const tenantId = event.target.value;
    const tenant = availableTenants.find(t => t.tenantId === tenantId || t.id === tenantId);
    onTenantSelect(tenant || null);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshConnection();
      await loadBASData();
    } catch (error: any) {
      console.error('❌ Error refreshing:', error);
    }
  };

  // Handle cache toggle
  const handleCacheToggle = () => {
    setUseCache(!useCache);
  };

  // Render connection status
  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Xero Connection Required
            </Typography>
            <Typography>
              You need to connect to Xero to process BAS data. Click the button below to connect.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={connectToXero}
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Connect to Xero'}
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render organization selection
  if (availableTenants.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              No Organizations Found
            </Typography>
            <Typography>
              No Xero organizations were found for your account. Please check your Xero account or reconnect.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefresh}
              sx={{ mt: 2 }}
            >
              Refresh Connection
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            BAS Processing
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Connection">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Cache">
              <IconButton onClick={clearCache}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Connection Status */}
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={isTokenValid ? <CheckCircleIcon /> : <ErrorIcon />}
            label={`Connected to ${selectedTenant?.name || 'Unknown'}`}
            color={isTokenValid ? 'success' : 'error'}
            sx={{ mr: 1 }}
          />
          {company && (
            <Chip
              label={`Company: ${company.name}`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        {/* Organization Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Organization</InputLabel>
          <Select
            value={selectedTenant?.tenantId || selectedTenant?.id || ''}
            onChange={handleTenantChange}
            label="Select Organization"
          >
            {availableTenants.map((tenant) => (
              <MenuItem key={tenant.tenantId || tenant.id} value={tenant.tenantId || tenant.id}>
                {tenant.name || tenant.organizationName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range Selection */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Options */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={useCache ? 'contained' : 'outlined'}
            size="small"
            onClick={handleCacheToggle}
            sx={{ mr: 2 }}
          >
            {useCache ? 'Using Cache' : 'Live Data'}
          </Button>
          <Button
            variant="outlined"
            onClick={loadBASData}
            disabled={dataLoading || !selectedTenant || !fromDate || !toDate}
            startIcon={dataLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {dataLoading ? 'Loading...' : 'Load BAS Data'}
          </Button>
        </Box>

        {/* Error Display */}
        {(connectionError || dataError || calculationError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Error
            </Typography>
            <Typography>
              {connectionError || dataError || calculationError}
            </Typography>
            {connectionError && (
              <Button
                variant="contained"
                color="primary"
                onClick={connectToXero}
                sx={{ mt: 1 }}
              >
                Reconnect to Xero
              </Button>
            )}
          </Alert>
        )}

        {/* BAS Calculation Results */}
        {calculationResult && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              BAS Calculation Results
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Item</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Sales (GST Inclusive)</TableCell>
                    <TableCell align="right">
                      ${calculationResult.totalSales.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Purchases (GST Inclusive)</TableCell>
                    <TableCell align="right">
                      ${calculationResult.totalPurchases.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GST on Sales</TableCell>
                    <TableCell align="right">
                      ${calculationResult.gstOnSales.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GST on Purchases</TableCell>
                    <TableCell align="right">
                      ${calculationResult.gstOnPurchases.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                    <TableCell><strong>Net GST Payable/Refundable</strong></TableCell>
                    <TableCell align="right">
                      <strong>
                        ${calculationResult.netGST.toFixed(2)}
                        {calculationResult.netGST >= 0 ? ' (Payable)' : ' (Refundable)'}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Period:</strong> {calculationResult.period.fromDate} to {calculationResult.period.toDate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Updated:</strong> {new Date(calculationResult.lastUpdated).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Loading States */}
        {isCalculating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography>Calculating BAS...</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default withXeroData(BASProcessor);