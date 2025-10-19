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
  Tooltip,
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
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [dateSelectionMode, setDateSelectionMode] = useState<'manual' | 'quarter'>('quarter');
  const requestSignatureRef = useRef<string | null>(null);

  const { company } = useAuth();
  
  // Use refs to avoid infinite loops with callback dependencies
  const onBASErrorRef = useRef(onBASError);
  const onBASCompleteRef = useRef(onBASComplete);
  
  // Update refs when props change
  useEffect(() => {
    onBASErrorRef.current = onBASError;
  }, [onBASError]);
  
  useEffect(() => {
    onBASCompleteRef.current = onBASComplete;
  }, [onBASComplete]);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Quarter calculation functions
  const getQuarterDates = (quarter: string, year: number) => {
    const quarters = {
      'Q1': { start: new Date(year, 6, 1), end: new Date(year, 8, 30) }, // Jul-Sep
      'Q2': { start: new Date(year, 9, 1), end: new Date(year, 11, 31) }, // Oct-Dec
      'Q3': { start: new Date(year, 0, 1), end: new Date(year, 2, 31) }, // Jan-Mar
      'Q4': { start: new Date(year, 3, 1), end: new Date(year, 5, 30) }  // Apr-Jun
    };
    return quarters[quarter as keyof typeof quarters];
  };

  const getCurrentBASQuarter = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    
    if (month >= 7 && month <= 9) return { quarter: 'Q1', year };
    if (month >= 10 && month <= 12) return { quarter: 'Q2', year };
    if (month >= 1 && month <= 3) return { quarter: 'Q3', year };
    if (month >= 4 && month <= 6) return { quarter: 'Q4', year };
    
    return { quarter: 'Q1', year }; // Default fallback
  };

  const handleQuarterChange = (quarter: string, year: number) => {
    const dates = getQuarterDates(quarter, year);
    if (dates) {
      setFromDate(formatDateForInput(dates.start));
      setToDate(formatDateForInput(dates.end));
      setSelectedQuarter(quarter);
    }
  };

  // Initialize with current BAS quarter
  useEffect(() => {
    const { quarter, year } = getCurrentBASQuarter();
    setSelectedQuarter(quarter);
    handleQuarterChange(quarter, year);
  }, []);

  // Load BAS data when tenant or dates change
  const loadBASData = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (!selectedTenant || !fromDate || !toDate) {
        setCalculationError('Please select an organization and date range first.');
        return;
      }

      const tenantId = selectedTenant.tenantId || selectedTenant.id;
      const requestSignature = `${tenantId}|${fromDate}|${toDate}|${useCache}`;
      if (!options.force && requestSignatureRef.current === requestSignature) {
        console.log('⚠️ Skipping BAS data reload; parameters unchanged');
        return;
      }

      requestSignatureRef.current = requestSignature;

      try {
        setCalculationError(null);
        console.log(`📊 Loading BAS data for ${selectedTenant.name} from ${fromDate} to ${toDate}`);
        
        const response = await loadXeroData('basData', {
          fromDate,
          toDate,
          useCache
        });
        const normalized = response?.data?.data ?? response?.data ?? response;
        setBasData(isPlainObject(normalized) ? normalized : response);
        console.log('✅ BAS data loaded successfully');
      } catch (error: any) {
        console.error('❌ Error loading BAS data:', error);

        // Provide more helpful error messages
        let errorMessage = error.message || 'Failed to load BAS data';
        
        if (error.response?.status === 404) {
          errorMessage = 'BAS data endpoint not found. Please ensure you are connected to Xero and try again.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please reconnect to Xero.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Access denied. Please check your Xero permissions.';
        } else if (error.message?.includes('Not connected')) {
          errorMessage = 'Not connected to Xero. Please connect first.';
        } else if (error.message?.includes('No organization selected')) {
          errorMessage = 'Please select a Xero organization first.';
        }

        setCalculationError(errorMessage);
        onBASErrorRef.current?.(errorMessage);
        requestSignatureRef.current = null;
      }
    },
    [selectedTenant, fromDate, toDate, useCache, loadXeroData],
  );

  // Auto-load data when dependencies change (with debounce)
  useEffect(() => {
    if (selectedTenant && fromDate && toDate && isConnected && isTokenValid) {
      const timeoutId = setTimeout(() => {
        loadBASData();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTenant, fromDate, toDate, isConnected, isTokenValid, useCache, loadBASData]);

  useEffect(() => {
    return () => {
      requestSignatureRef.current = null;
    };
  }, []);

  // Calculate BAS
  const calculateBAS = useCallback(async () => {
    if (!basData) {
      setCalculationError('No BAS data available. Please load data first.');
      return;
    }

    try {
      setIsCalculating(true);
      setCalculationError(null);
      
      console.log('🧮 Calculating BAS from aggregated Xero data...');

      const dataRoot = isPlainObject(basData.data) ? basData.data : basData;
      const gstReport = getSectionData(basData, 'gstReport') || getSectionData(dataRoot, 'gstReport');
      const profitLoss = getSectionData(basData, 'profitLoss') || getSectionData(dataRoot, 'profitLoss');
      const invoicesWrapper = getSectionData(basData, 'invoices') || getSectionData(dataRoot, 'invoices');
      const invoices = Array.isArray(invoicesWrapper?.Invoices)
        ? invoicesWrapper.Invoices
        : Array.isArray(invoicesWrapper)
        ? invoicesWrapper
        : [];

      let totalSales = 0;
      let totalPurchases = 0;
      let gstOnSales = 0;
      let gstOnPurchases = 0;

      // 1. Extract GST information from Tax Summary report
      if (gstReport?.Reports?.[0]?.Rows) {
        const taxRows = gstReport.Reports[0].Rows;
        
        taxRows.forEach((row: any) => {
          if (row.Cells && row.Cells.length > 0) {
            const cells = row.Cells;
            const description = cells[0]?.Value || '';
            const value = parseFloat(cells[cells.length - 1]?.Value || '0');

            // Map GST line items from Tax Summary
            if (description.toLowerCase().includes('gst on sales') || 
                description.toLowerCase().includes('output tax')) {
              gstOnSales += Math.abs(value);
            } else if (description.toLowerCase().includes('gst on purchases') || 
                       description.toLowerCase().includes('input tax')) {
              gstOnPurchases += Math.abs(value);
            } else if (description.toLowerCase().includes('total sales')) {
              totalSales += Math.abs(value);
            } else if (description.toLowerCase().includes('total purchases')) {
              totalPurchases += Math.abs(value);
            }
          }
        });
      }

      // 2. If GST data not found in Tax Summary, calculate from invoices
      if (gstOnSales === 0 && invoices?.Invoices) {
        invoices.Invoices.forEach((invoice: any) => {
          if (invoice.Type === 'ACCREC') { // Sales invoices
            const subtotal = parseFloat(invoice.SubTotal || '0');
            const taxAmount = parseFloat(invoice.TotalTax || '0');
            totalSales += subtotal;
            gstOnSales += taxAmount;
          } else if (invoice.Type === 'ACCPAY') { // Purchase invoices
            const subtotal = parseFloat(invoice.SubTotal || '0');
            const taxAmount = parseFloat(invoice.TotalTax || '0');
            totalPurchases += subtotal;
            gstOnPurchases += taxAmount;
          }
        });
      }

      // 3. Extract total sales/revenue from Profit & Loss if needed
      if (totalSales === 0 && profitLoss?.Reports?.[0]?.Rows) {
        const plRows = profitLoss.Reports[0].Rows;
        plRows.forEach((row: any) => {
          if (row.RowType === 'Section' && row.Title?.toLowerCase().includes('revenue')) {
            row.Rows?.forEach((subRow: any) => {
              if (subRow.Cells && subRow.Cells.length > 0) {
                const value = parseFloat(subRow.Cells[subRow.Cells.length - 1]?.Value || '0');
                totalSales += Math.abs(value);
              }
            });
          }
        });
      }

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
      onBASCompleteRef.current?.(result);
      
      console.log('✅ BAS calculation completed successfully');
    } catch (error: any) {
      console.error('❌ Error calculating BAS:', error);
      const errorMessage = error.message || 'Failed to calculate BAS';
      setCalculationError(errorMessage);
      onBASErrorRef.current?.(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, [basData, fromDate, toDate]);

  // Auto-load data when dependencies change (with debounce)
  useEffect(() => {
    if (selectedTenant && fromDate && toDate && isConnected && isTokenValid) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        loadBASData();
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
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
      await loadBASData({ force: true });
    } catch (error: any) {
      console.error('❌ Error refreshing:', error);
    }
  };

  // Handle cache toggle
  const handleCacheToggle = () => {
    setUseCache(!useCache);
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!selectedTenant || !fromDate || !toDate) {
      setCalculationError('Please load BAS data first before downloading PDF.');
      return;
    }

    try {
      const tenantId = selectedTenant.tenantId || selectedTenant.id;
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        tenantId,
        fromDate,
        toDate,
        quarter: selectedQuarter || ''
      });

      const url = `https://compliance-manager-backend.onrender.com/api/xero/bas-data/pdf?${params.toString()}`;
      
      console.log('📄 Downloading BAS PDF from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `BAS_Report_${selectedQuarter || fromDate}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ BAS PDF downloaded successfully');
    } catch (error: any) {
      console.error('❌ Error downloading BAS PDF:', error);
      setCalculationError('Failed to download PDF: ' + error.message);
    }
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

        {/* Date Selection Mode Toggle */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant={dateSelectionMode === 'quarter' ? 'contained' : 'outlined'}
            onClick={() => setDateSelectionMode('quarter')}
            sx={{ mr: 1 }}
            size="small"
          >
            📅 Quarter Selection
          </Button>
          <Button
            variant={dateSelectionMode === 'manual' ? 'contained' : 'outlined'}
            onClick={() => setDateSelectionMode('manual')}
            size="small"
          >
            📆 Manual Dates
          </Button>
        </Box>

        {/* Quarter Selection */}
        {dateSelectionMode === 'quarter' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>BAS Quarter</InputLabel>
                <Select
                  value={selectedQuarter}
                  onChange={(e) => {
                    const quarter = e.target.value;
                    const currentYear = new Date().getFullYear();
                    handleQuarterChange(quarter, currentYear);
                  }}
                  label="BAS Quarter"
                >
                  <MenuItem value="Q1">Q1 (Jul-Sep)</MenuItem>
                  <MenuItem value="Q2">Q2 (Oct-Dec)</MenuItem>
                  <MenuItem value="Q3">Q3 (Jan-Mar)</MenuItem>
                  <MenuItem value="Q4">Q4 (Apr-Jun)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Financial Year"
                type="number"
                value={new Date().getFullYear()}
                disabled
                helperText="BAS Year (April to March)"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Selected Period:</strong> {fromDate} to {toDate}
                  {selectedQuarter && ` (${selectedQuarter} ${new Date().getFullYear()})`}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Manual Date Range Selection */}
        {dateSelectionMode === 'manual' && (
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
        )}

        {/* Options */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={useCache ? 'contained' : 'outlined'}
            size="small"
            onClick={handleCacheToggle}
          >
            {useCache ? 'Using Cache' : 'Live Data'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => loadBASData({ force: true })}
            disabled={dataLoading || !selectedTenant || !fromDate || !toDate}
            startIcon={dataLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {dataLoading ? 'Loading...' : 'Load BAS Data'}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleDownloadPDF}
            disabled={!basData || dataLoading}
            startIcon={<DownloadIcon />}
          >
            📄 Download PDF
          </Button>
        </Box>

        {/* Instructions Panel */}
        {!isConnected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Getting Started with BAS Processing
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              To process BAS data, you need to:
            </Typography>
            <Box component="ol" sx={{ pl: 2, mb: 2 }}>
              <Typography component="li" variant="body2">Connect to your Xero account</Typography>
              <Typography component="li" variant="body2">Select the organization to process</Typography>
              <Typography component="li" variant="body2">Choose the date range for BAS calculation</Typography>
              <Typography component="li" variant="body2">Load and review the BAS data</Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={connectToXero}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Connect to Xero'}
            </Button>
          </Alert>
        )}

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
            {calculationError && calculationError.includes('endpoint not found') && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Troubleshooting steps:
                </Typography>
                <Box component="ol" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">Ensure you are connected to Xero</Typography>
                  <Typography component="li" variant="body2">Select a valid organization</Typography>
                  <Typography component="li" variant="body2">Check that your Xero account has BAS reporting enabled</Typography>
                  <Typography component="li" variant="body2">Try refreshing the connection</Typography>
                </Box>
              </Box>
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

        {basData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Detailed BAS Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Raw data returned from Xero for the selected period.
            </Typography>
            {renderXeroDataPreview([
              { label: 'Reporting Period', value: getSectionData(basData, 'period') },
              { label: 'Metadata', value: getSectionData(basData, 'metadata') },
              { label: 'GST Report', value: getSectionData(basData, 'gstReport') },
              { label: 'BAS Reports', value: getSectionData(basData, 'Reports') },
              {
                label: 'Invoices',
                value:
                  getSectionData(basData, 'invoices')?.Invoices ??
                  getSectionData(basData, 'invoices'),
              },
              { label: 'Profit & Loss', value: getSectionData(basData, 'profitLoss') },
              { label: 'Balance Sheet', value: getSectionData(basData, 'balanceSheet') },
              { label: 'Accounts', value: getSectionData(basData, 'accounts') },
              { label: 'Bank Transactions', value: getSectionData(basData, 'bankTransactions') },
              { label: 'Payroll Summary', value: getSectionData(basData, 'payrollSummary') },
            ])}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default withXeroData(BASProcessor);
