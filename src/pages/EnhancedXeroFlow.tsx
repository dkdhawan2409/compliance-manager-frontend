import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useXero } from '../contexts/XeroContext';
import { useAuth } from '../contexts/AuthContext';

type SectionId = 'organization' | 'financial-summary' | 'invoices' | 'contacts' | 'accounts';

interface SectionColumn {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface SectionConfig {
  id: SectionId;
  title: string;
  resource: string;
  description?: string;
  limit?: number;
  columns?: SectionColumn[];
}

interface SectionState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: any;
  error: string | null;
}

const DATA_SECTIONS: SectionConfig[] = [
  {
    id: 'organization',
    title: 'Organization Overview',
    resource: 'organization',
    description: 'Core information about the selected Xero organization.',
  },
  {
    id: 'financial-summary',
    title: 'Financial Summary',
    resource: 'financial-summary',
    description: 'High-level financial metrics calculated from Xero data.',
  },
  {
    id: 'invoices',
    title: 'Recent Invoices',
    resource: 'invoices',
    description: 'Latest invoices created in the selected organization.',
    limit: 10,
    columns: [
      {
        key: 'InvoiceNumber',
        label: 'Invoice #',
        render: (row) => row.InvoiceNumber || row.InvoiceID || '—',
      },
      {
        key: 'Contact',
        label: 'Contact',
        render: (row) => row.Contact?.Name || row.ContactName || '—',
      },
      {
        key: 'Date',
        label: 'Issue Date',
        render: (row) => formatDate(row.Date || row.IssueDate),
      },
      {
        key: 'DueDate',
        label: 'Due Date',
        render: (row) => formatDate(row.DueDate),
      },
      {
        key: 'Total',
        label: 'Total',
        render: (row) => formatCurrency(row.Total ?? row.AmountDue),
      },
      {
        key: 'Status',
        label: 'Status',
        render: (row) => row.Status || '—',
      },
    ],
  },
  {
    id: 'contacts',
    title: 'Key Contacts',
    resource: 'contacts',
    description: 'Contacts and suppliers synced from Xero.',
    limit: 10,
    columns: [
      {
        key: 'Name',
        label: 'Name',
        render: (row) => row.Name || `${row.FirstName || ''} ${row.LastName || ''}`.trim() || '—',
      },
      {
        key: 'EmailAddress',
        label: 'Email',
        render: (row) => row.EmailAddress || '—',
      },
      {
        key: 'ContactStatus',
        label: 'Status',
        render: (row) => row.ContactStatus || '—',
      },
      {
        key: 'AccountsReceivable',
        label: 'A/R Outstanding',
        render: (row) => formatCurrency(row.AccountsReceivable?.Outstanding),
      },
    ],
  },
  {
    id: 'accounts',
    title: 'Chart of Accounts',
    resource: 'accounts',
    description: 'Accounts available within the selected organization.',
    limit: 15,
    columns: [
      {
        key: 'Code',
        label: 'Code',
        render: (row) => row.Code || '—',
      },
      {
        key: 'Name',
        label: 'Name',
        render: (row) => row.Name || '—',
      },
      {
        key: 'Type',
        label: 'Type',
        render: (row) => row.Type || row.Class || '—',
      },
      {
        key: 'Status',
        label: 'Status',
        render: (row) => row.Status || '—',
      },
    ],
  },
] as const;

const buildInitialSectionState = (): Record<SectionId, SectionState> => {
  const state = {} as Record<SectionId, SectionState>;
  DATA_SECTIONS.forEach((section) => {
    state[section.id] = { status: 'idle', data: null, error: null };
  });
  return state;
};

const extractXeroData = (input: any): any => {
  if (input == null) return input;
  if (Array.isArray(input)) return input;
  if (typeof input !== 'object') return input;

  if (Object.prototype.hasOwnProperty.call(input, 'data')) {
    return extractXeroData(input.data);
  }

  const keys = [
    'Organisation',
    'Organisations',
    'organization',
    'Invoices',
    'Invoice',
    'Contacts',
    'Accounts',
    'BankTransactions',
    'Transactions',
    'items',
    'values',
    'results',
  ];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      return extractXeroData((input as Record<string, any>)[key]);
    }
  }

  return input;
};

const formatCurrency = (value: any): string => {
  if (value == null || value === '') {
    return '—';
  }

  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number.parseFloat(value)
      : NaN;

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return numeric.toLocaleString(undefined, {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value: any): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const getRowKey = (row: any, index: number): string => {
  return (
    row?.InvoiceID ||
    row?.ContactID ||
    row?.AccountID ||
    row?.id ||
    row?.Id ||
    `row-${index}`
  );
};

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
    refreshData,
    loadData,
  } = useXero();

  const { company } = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectionRefreshing, setConnectionRefreshing] = useState(false);
  const [sectionState, setSectionState] = useState<Record<SectionId, SectionState>>(
    () => buildInitialSectionState(),
  );

  const tenantIdentifier = selectedTenant?.tenantId || selectedTenant?.id || null;

  const fetchSectionData = useCallback(
    async (section: SectionConfig) => {
      if (!status.connected || !tenantIdentifier) {
        return;
      }

      setSectionState((prev) => ({
        ...prev,
        [section.id]: { status: 'loading', data: prev[section.id]?.data ?? null, error: null },
      }));

      try {
        const response = await loadData(section.resource as any, {
          tenantId: tenantIdentifier,
          pageSize: section.limit,
          page: 1,
        });

        const normalized = extractXeroData(response);

        setSectionState((prev) => ({
          ...prev,
          [section.id]: { status: 'success', data: normalized, error: null },
        }));
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || `Failed to load ${section.title}`;
        setSectionState((prev) => ({
          ...prev,
          [section.id]: { status: 'error', data: null, error: message },
        }));
      }
    },
    [loadData, status.connected, tenantIdentifier],
  );

  const loadAllSections = useCallback(async () => {
    if (!status.connected || !tenantIdentifier) {
      setSectionState(buildInitialSectionState());
      return;
    }

    await Promise.all(DATA_SECTIONS.map((section) => fetchSectionData(section)));
  }, [fetchSectionData, status.connected, tenantIdentifier]);

  useEffect(() => {
    if (status.connected && tenantIdentifier) {
      loadAllSections();
    } else {
      setSectionState(buildInitialSectionState());
    }
  }, [status.connected, tenantIdentifier, loadAllSections]);

  const handleTenantChange = (event: any) => {
    const value = event.target.value;
    const tenant = availableTenants.find(
      (t) => t.tenantId === value || t.id === value,
    );
    selectTenant(tenant || null);
  };

  const handleConnectionRefresh = async () => {
    try {
      setConnectionRefreshing(true);
      await refreshData();
      await loadAllSections();
    } catch (refreshError) {
      console.error('❌ Error refreshing Xero connection:', refreshError);
    } finally {
      setConnectionRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSectionState(buildInitialSectionState());
    } catch (disconnectError) {
      console.error('❌ Error disconnecting from Xero:', disconnectError);
    }
  };

  const handleRefreshSection = async (section: SectionConfig) => {
    await fetchSectionData(section);
  };

  const renderConnectionStatus = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Xero Connection Status</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Connection & Data">
              <IconButton onClick={handleConnectionRefresh} disabled={connectionRefreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Disconnect">
              <IconButton onClick={handleDisconnect} disabled={isLoading}>
                <ErrorIcon />
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
                size="medium"
              />
              {company && (
                <Chip
                  label={`Company: ${company.companyName || company.name || company.email || '—'}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            {status.connected && availableTenants.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Organization</InputLabel>
                <Select
                  value={tenantIdentifier || ''}
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
                <strong>Selected Organization:</strong>{' '}
                {selectedTenant.name || selectedTenant.organizationName}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderOrganizationSection = (data: any) => {
    const record = Array.isArray(data) ? data[0] : data;
    if (!record || typeof record !== 'object') {
      return (
        <Typography variant="body2" color="text.secondary">
          No organization details available.
        </Typography>
      );
    }

    const fields = [
      { label: 'Legal Name', value: record.LegalName || record.Name },
      { label: 'Trading Name', value: record.TradingName },
      { label: 'Country', value: record.CountryCode || record.Country },
      { label: 'Base Currency', value: record.BaseCurrency },
      { label: 'Tax Number', value: record.TaxNumber },
      { label: 'Financial Year End', value: record.FinancialYearEndDay && record.FinancialYearEndMonth
          ? `${record.FinancialYearEndDay}/${record.FinancialYearEndMonth}`
          : null },
      { label: 'Organisation Status', value: record.OrganisationStatus || record.Status },
      { label: 'Phone Number', value: record.PhoneNumber },
      { label: 'Email', value: record.Email },
      { label: 'Time Zone', value: record.Timezone },
    ];

    const visibleFields = fields.filter((field) => field.value);

    if (!visibleFields.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          Organization profile data is unavailable.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2}>
        {visibleFields.map((field) => (
          <Grid item xs={12} md={6} key={field.label}>
            <Typography variant="subtitle2">{field.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {String(field.value)}
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFinancialSummarySection = (data: any) => {
    const summary = Array.isArray(data) ? data[0] : data;
    if (!summary || typeof summary !== 'object') {
      return (
        <Typography variant="body2" color="text.secondary">
          No financial summary available.
        </Typography>
      );
    }

    const metrics = [
      { label: 'Total Revenue', value: summary.totalRevenue },
      { label: 'Paid Revenue', value: summary.paidRevenue },
      { label: 'Outstanding Revenue', value: summary.outstandingRevenue },
      { label: 'Total Expenses', value: summary.totalExpenses },
      { label: 'Net Income', value: summary.netIncome },
      { label: 'Invoice Count', value: summary.invoiceCount },
      { label: 'Transaction Count', value: summary.transactionCount },
    ].filter((metric) => metric.value !== undefined && metric.value !== null);

    if (!metrics.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          Financial summary data is unavailable for this organization.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} key={metric.label}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6">
                  {typeof metric.value === 'number' || /^[0-9\.\-]+$/.test(String(metric.value))
                    ? formatCurrency(metric.value)
                    : String(metric.value)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderTableSection = (section: SectionConfig, data: any) => {
    const rows = Array.isArray(data) ? data.slice(0, section.limit || 25) : [];
    if (!rows.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No {section.title.toLowerCase()} available.
        </Typography>
      );
    }

    const columns = section.columns;
    if (!columns || !columns.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No columns configured for this section.
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow hover key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? column.render(row) : row[column.key] || '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSectionContent = (section: SectionConfig) => {
    const state = sectionState[section.id];

    if (!state || state.status === 'idle') {
      return (
        <Typography variant="body2" color="text.secondary">
          Select an organization to load {section.title.toLowerCase()}.
        </Typography>
      );
    }

    if (state.status === 'loading') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Loading {section.title.toLowerCase()}...</Typography>
        </Box>
      );
    }

    if (state.status === 'error') {
      return (
        <Alert severity="error">
          {state.error || `Failed to load ${section.title.toLowerCase()}.`}
        </Alert>
      );
    }

    if (section.id === 'organization') {
      return renderOrganizationSection(state.data);
    }

    if (section.id === 'financial-summary') {
      return renderFinancialSummarySection(state.data);
    }

    return renderTableSection(section, state.data);
  };

  if (!status.connected) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Xero Integration
        </Typography>

        {renderConnectionStatus()}

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Connect to Xero to Access Your Data
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Connect your Xero account to view organization insights and synced financial data.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={connect}
              disabled={isLoading}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Connecting...
                </Box>
              ) : (
                'Connect to Xero'
              )}
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Xero Integration
      </Typography>

      {renderConnectionStatus()}

      {!tenantIdentifier && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select an organization to load Xero data.
        </Alert>
      )}

      {tenantIdentifier &&
        DATA_SECTIONS.map((section) => (
          <Card key={section.id} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: section.description ? 1 : 0,
                }}
              >
                <Typography variant="h6">{section.title}</Typography>
                <Tooltip title={`Refresh ${section.title}`}>
                  <span>
                    <IconButton
                      onClick={() => handleRefreshSection(section)}
                      disabled={sectionState[section.id]?.status === 'loading'}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {section.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {section.description}
                </Typography>
              )}

              {renderSectionContent(section)}
            </CardContent>
          </Card>
        ))}

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xero Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tenant management and advanced settings will be available here soon.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
          <Button onClick={handleConnectionRefresh} disabled={connectionRefreshing}>
            {connectionRefreshing ? <CircularProgress size={16} /> : 'Refresh'}
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
