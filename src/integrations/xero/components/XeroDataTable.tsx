// Xero Data Table Component
// Flexible data table for displaying Xero data with pagination, filtering, and sorting

import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  FilterList,
  Refresh,
  Download,
  Search,
  MoreVert,
} from '@mui/icons-material';
import { useXero } from '../context/XeroProvider';
import { XeroDataTableProps, XeroResourceType } from '../types';

export const XeroDataTable: React.FC<XeroDataTableProps> = ({
  resourceType,
  tenantId,
  columns,
  pageSize = 50,
  showPagination = true,
  showFilters = true,
  className = '',
  onRowClick,
  onDataLoad,
}) => {
  const { state, loadData } = useXero();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { isConnected, selectedTenant, isLoading } = state;

  useEffect(() => {
    if (isConnected && (tenantId || selectedTenant)) {
      loadTableData();
    }
  }, [isConnected, tenantId, selectedTenant, page, rowsPerPage, statusFilter, sortField, sortDirection]);

  const loadTableData = async () => {
    try {
      setLoading(true);
      setError(null);

      const targetTenantId = tenantId || selectedTenant?.id;
      if (!targetTenantId) {
        throw new Error('No tenant selected');
      }

      const response = await loadData({
        resourceType,
        tenantId: targetTenantId,
        page: page + 1, // API uses 1-based pagination
        pageSize: rowsPerPage,
        filters: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sort: sortField ? `${sortField}:${sortDirection}` : undefined,
        },
      });

      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : 
                         response.data[resourceType] || 
                         Object.values(response.data)[0] || 
                         [];
        
        setData(dataArray);
        setTotalCount(response.pagination?.itemCount || dataArray.length);
        onDataLoad?.(dataArray);
      } else {
        throw new Error(response.message || 'Failed to load data');
      }
    } catch (err: any) {
      console.error(`❌ Failed to load ${resourceType}:`, err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((row) => {
      return Object.values(row).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some((subValue) => 
            typeof subValue === 'string' && 
            subValue.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return false;
      });
    });
  }, [data, searchTerm]);

  const getDefaultColumns = (): string[] => {
    switch (resourceType) {
      case 'invoices':
        return ['InvoiceNumber', 'Contact', 'Date', 'DueDate', 'Status', 'Total'];
      case 'contacts':
        return ['Name', 'EmailAddress', 'ContactStatus', 'AccountsReceivable'];
      case 'bank-transactions':
        return ['Date', 'Reference', 'BankAccount', 'Total', 'BankTransactionType', 'Status'];
      case 'accounts':
        return ['Code', 'Name', 'Type', 'Status', 'Description'];
      default:
        return Object.keys(data[0] || {});
    }
  };

  const displayColumns = columns || getDefaultColumns();

  const formatCellValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object') {
      if (column === 'Contact' && value.Name) return value.Name;
      if (column === 'BankAccount' && value.Name) return value.Name;
      if (column === 'AccountsReceivable' && value.Outstanding !== undefined) {
        return `$${value.Outstanding.toFixed(2)}`;
      }
      return JSON.stringify(value);
    }
    
    if (typeof value === 'number') {
      if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('total')) {
        return `$${value.toFixed(2)}`;
      }
      return value.toString();
    }
    
    if (typeof value === 'string' && column.toLowerCase().includes('date')) {
      return new Date(value).toLocaleDateString();
    }
    
    return value.toString();
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'AUTHORISED':
      case 'PAID':
        return 'success';
      case 'DRAFT':
      case 'SUBMITTED':
        return 'warning';
      case 'VOIDED':
      case 'DELETED':
      case 'ARCHIVED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!isConnected) {
    return (
      <Paper className={`xero-data-table ${className}`}>
        <Box className="p-4">
          <Alert severity="info">
            Connect to Xero to view {resourceType} data
          </Alert>
        </Box>
      </Paper>
    );
  }

  if (loading || isLoading) {
    return (
      <Paper className={`xero-data-table ${className}`}>
        <Box className="flex justify-center items-center py-8">
          <CircularProgress />
          <Typography variant="body1" className="ml-3">
            Loading {resourceType}...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper className={`xero-data-table ${className}`}>
        <Box className="p-4">
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
          <Button 
            variant="outlined" 
            onClick={loadTableData}
            startIcon={<Refresh />}
          >
            Retry
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper className={`xero-data-table ${className}`}>
      {/* Header with search and filters */}
      <Box className="p-4 border-b">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6">
            {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
          </Typography>
          <Box className="flex gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={loadTableData}
              startIcon={<Refresh />}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
            >
              Export
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box className="flex gap-4 items-center">
            <TextField
              size="small"
              placeholder={`Search ${resourceType}...`}
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search className="mr-2" />,
              }}
              className="flex-1"
            />
            
            {resourceType === 'invoices' && (
              <FormControl size="small" className="min-w-32">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="AUTHORISED">Authorised</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                  <MenuItem value="VOIDED">Voided</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {resourceType === 'contacts' && (
              <FormControl size="small" className="min-w-32">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {displayColumns.map((column) => (
                <TableCell
                  key={column}
                  className="font-medium cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort(column)}
                >
                  {column}
                  {sortField === column && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length + 1} className="text-center py-8">
                  <Typography variant="body2" color="text.secondary">
                    No {resourceType} found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRow 
                  key={row[`${resourceType.slice(0, -1)}ID`] || index}
                  hover
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {displayColumns.map((column) => {
                    const value = row[column];
                    const formattedValue = formatCellValue(value, column);
                    
                    return (
                      <TableCell key={column}>
                        {column.toLowerCase().includes('status') ? (
                          <Chip 
                            label={formattedValue} 
                            size="small"
                            color={getStatusColor(formattedValue)}
                          />
                        ) : (
                          formattedValue
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {showPagination && (
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};
