import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  isPlainObject,
  getSectionData,
  renderXeroDataPreview,
} from './XeroDataPreview';

interface FASProcessorProps extends XeroDataProps {
  // Additional props specific to FAS processing
  onFASComplete?: (data: any) => void;
  onFASError?: (error: string) => void;
}


interface FASCalculationResult {
  totalFBT: number;
  fbtOnCars: number;
  fbtOnEntertainment: number;
  fbtOnOther: number;
  grossTaxableValue: number;
  fbtPayable: number;
  period: {
    fromDate: string;
    toDate: string;
  };
  lastUpdated: string;
}

const FASProcessor: React.FC<FASProcessorProps> = ({
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
  // FAS specific props
  onFASComplete,
  onFASError
}) => {
  // State
  const [fasData, setFasData] = useState<any>(null);
  const [calculationResult, setCalculationResult] = useState<FASCalculationResult | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [useCache, setUseCache] = useState(true);
  const requestSignatureRef = useRef<string | null>(null);

  const { company } = useAuth();

  // Initialize date range (current FBT year)
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    // FBT year runs from April 1 to March 31
    const fbtYearStart = new Date(currentYear, 3, 1); // April 1
    const fbtYearEnd = new Date(currentYear + 1, 2, 31); // March 31

    setFromDate(fbtYearStart.toISOString().split('T')[0]);
    setToDate(fbtYearEnd.toISOString().split('T')[0]);
  }, []);

  // Load FAS data when tenant or dates change
  const loadFASData = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (!selectedTenant || !fromDate || !toDate) {
        setCalculationError('Please select an organization and date range first.');
        return;
      }

      const tenantId = selectedTenant.tenantId || selectedTenant.id;
      const signature = `${tenantId}|${fromDate}|${toDate}|${useCache}`;
      if (!options.force && requestSignatureRef.current === signature) {
        console.log('⚠️ Skipping FAS data reload; parameters unchanged');
        return;
      }

      requestSignatureRef.current = signature;

      try {
        setCalculationError(null);
        console.log(`📊 Loading FAS data for ${selectedTenant.name} from ${fromDate} to ${toDate}`);

        const response = await loadXeroData('fasData', {
          fromDate,
          toDate,
          useCache
        });
        const normalized = response?.data?.data ?? response?.data ?? response;
        setFasData(isPlainObject(normalized) ? normalized : response);
        console.log('✅ FAS data loaded successfully');
      } catch (error: any) {
        console.error('❌ Error loading FAS data:', error);
        const message = error.message || 'Failed to load FAS data';
        setCalculationError(message);
        onFASError?.(message);
        requestSignatureRef.current = null;
      }
    },
    [selectedTenant, fromDate, toDate, useCache, loadXeroData, onFASError]
  );

  // Calculate FAS
  const calculateFAS = useCallback(async () => {
    if (!fasData) {
      setCalculationError('No FAS data available. Please load data first.');
      return;
    }

    try {
      setIsCalculating(true);
      setCalculationError(null);
      
      console.log('🧮 Calculating FAS...');

      const dataRoot = isPlainObject(fasData.data) ? fasData.data : fasData;
      const fasReport =
        getSectionData(fasData, 'fasReport') ||
        getSectionData(dataRoot, 'fasReport') ||
        getSectionData(dataRoot, 'reports');

      const rows = Array.isArray(fasReport?.Rows)
        ? fasReport.Rows
        : Array.isArray(fasReport)
        ? fasReport
        : fasReport?.Reports?.[0]?.Rows || [];
      let totalFBT = 0;
      let fbtOnCars = 0;
      let fbtOnEntertainment = 0;
      let fbtOnOther = 0;
      let grossTaxableValue = 0;

      if (Array.isArray(rows) && rows.length > 0) {
        rows.forEach((row: any) => {
          if (row.Cells && row.Cells.length > 0) {
            const cells = row.Cells;
            const description = (cells[0]?.Value || '').toLowerCase();
            const value = parseFloat(cells[cells.length - 1]?.Value || '0');

            if (description.includes('car')) {
              fbtOnCars += Math.abs(value);
            } else if (description.includes('entertainment')) {
              fbtOnEntertainment += Math.abs(value);
            } else if (description.includes('gross taxable value')) {
              grossTaxableValue += Math.abs(value);
            } else if (description.includes('fbt')) {
              fbtOnOther += Math.abs(value);
            }
          }
        });
      } else {
        console.warn('⚠️ FAS report rows not available; raw dataset will be displayed.');
        setCalculationError('FAS summary report not available for this period. Showing raw dataset below.');
        setCalculationResult(null);
        return;
      }

      totalFBT = fbtOnCars + fbtOnEntertainment + fbtOnOther;
      const fbtPayable = totalFBT * 0.47; // FBT rate is 47%

      const result: FASCalculationResult = {
        totalFBT,
        fbtOnCars,
        fbtOnEntertainment,
        fbtOnOther,
        grossTaxableValue,
        fbtPayable,
        period: {
          fromDate,
          toDate
        },
        lastUpdated: new Date().toISOString()
      };

      setCalculationResult(result);
      onFASComplete?.(result);
      
      console.log('✅ FAS calculation completed successfully');
    } catch (error: any) {
      console.error('❌ Error calculating FAS:', error);
      const errorMessage = error.message || 'Failed to calculate FAS';
      setCalculationError(errorMessage);
      onFASError?.(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, [fasData, fromDate, toDate, onFASComplete, onFASError]);

  // Auto-load data when dependencies change
  useEffect(() => {
    if (selectedTenant && fromDate && toDate && isConnected && isTokenValid) {
      const timeoutId = setTimeout(() => {
        loadFASData();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTenant, fromDate, toDate, isConnected, isTokenValid, useCache, loadFASData]);

  useEffect(() => {
    return () => {
      requestSignatureRef.current = null;
    };
  }, []);

  // Auto-calculate when data changes
  useEffect(() => {
    if (fasData && !calculationResult) {
      calculateFAS();
    }
  }, [fasData, calculationResult, calculateFAS]);

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
      await loadFASData({ force: true });
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
              You need to connect to Xero to process FAS data. Click the button below to connect.
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
            FAS Processing
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
            onClick={() => loadFASData({ force: true })}
            disabled={dataLoading || !selectedTenant || !fromDate || !toDate}
            startIcon={dataLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {dataLoading ? 'Loading...' : 'Load FAS Data'}
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

        {/* FAS Calculation Results */}
        {calculationResult && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              FAS Calculation Results
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
                    <TableCell>FBT on Cars</TableCell>
                    <TableCell align="right">
                      ${calculationResult.fbtOnCars.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>FBT on Entertainment</TableCell>
                    <TableCell align="right">
                      ${calculationResult.fbtOnEntertainment.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>FBT on Other Benefits</TableCell>
                    <TableCell align="right">
                      ${calculationResult.fbtOnOther.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total FBT</TableCell>
                    <TableCell align="right">
                      ${calculationResult.totalFBT.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gross Taxable Value</TableCell>
                    <TableCell align="right">
                      ${calculationResult.grossTaxableValue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                    <TableCell><strong>FBT Payable (47%)</strong></TableCell>
                    <TableCell align="right">
                      <strong>${calculationResult.fbtPayable.toFixed(2)}</strong>
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
            <Typography>Calculating FAS...</Typography>
          </Box>
        )}

        {fasData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Detailed FAS Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Raw data returned from Xero for the selected period.
            </Typography>
            {renderXeroDataPreview([
              { label: 'Reporting Period', value: getSectionData(fasData, 'period') },
              { label: 'Metadata', value: getSectionData(fasData, 'metadata') },
              { label: 'FBT Summary', value: getSectionData(fasData, 'fbtSummary') },
              {
                label: 'FAS Reports',
                value: getSectionData(fasData, 'fasReport') || getSectionData(fasData, 'Reports'),
              },
              { label: 'Accounts', value: getSectionData(fasData, 'accounts') },
              { label: 'Balance Sheet', value: getSectionData(fasData, 'balanceSheet') },
              { label: 'Profit & Loss', value: getSectionData(fasData, 'profitLoss') },
              { label: 'Transactions', value: getSectionData(fasData, 'transactions') },
              { label: 'Bank Transactions', value: getSectionData(fasData, 'bankTransactions') },
            ])}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default withXeroData(FASProcessor);
