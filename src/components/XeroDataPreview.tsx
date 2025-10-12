import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

export const isPlainObject = (value: any): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const flattenArray = (value: any): any => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenArray(item));
  }
  return [value];
};

export const getSectionData = (source: any, key: string) => {
  if (!source) return null;
  const variants = [key, key.toLowerCase(), key.toUpperCase()];

  for (const variant of variants) {
    if (source[variant] !== undefined) {
      return source[variant];
    }
  }

  if (isPlainObject(source.data)) {
    for (const variant of variants) {
      if (source.data[variant] !== undefined) {
        return source.data[variant];
      }
    }
  }

  return null;
};

const flattenReportRows = (rows: any[], depth = 0): Record<string, any>[] => {
  const items: Record<string, any>[] = [];

  if (!Array.isArray(rows)) {
    return items;
  }

  rows.forEach((row) => {
    if (!row) return;

    if (row.RowType === 'Section' && Array.isArray(row.Rows)) {
      // Add section header if it has a title
      if (row.Title) {
        items.push({
          'Description': `📁 ${row.Title}`,
          'Value': 'Section Header',
          'Type': 'Section'
        });
      }
      items.push(...flattenReportRows(row.Rows, depth + 1));
      return;
    }

    if (Array.isArray(row.Cells)) {
      const record: Record<string, any> = {};
      
      // Add row type for context
      if (row.RowType) {
        record['Type'] = row.RowType;
      }
      
      row.Cells.forEach((cell: any, index: number) => {
        let key;
        
        if (index === 0) {
          key = 'Description';
        } else if (row.Cells.length === 2 && index === row.Cells.length - 1) {
          key = 'Value';
        } else if (index === 1) {
          key = 'Current Period';
        } else if (index === 2) {
          key = 'Previous Period';
        } else {
          key = `Column ${index + 1}`;
        }
        
        // Handle duplicate keys
        if (record[key] !== undefined) {
          record[`${key} (${index + 1})`] = cell?.Value ?? '';
        } else {
          record[key] = cell?.Value ?? '';
        }
      });
      
      if (Object.keys(record).length > 0) {
        items.push(record);
      }
    }
  });

  return items;
};

const normalizeXeroValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value;
  }

  if (isPlainObject(value)) {
    if (Array.isArray(value.Rows)) {
      const flattened = flattenReportRows(value.Rows);
      if (flattened.length) {
        return flattened;
      }
    }

    if (Array.isArray(value.Reports)) {
      const flattened = value.Reports.flatMap((report: any) =>
        flattenReportRows(report?.Rows),
      );
      if (flattened.length) {
        return flattened;
      }
    }

    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (Array.isArray(value.Values)) {
      return value.Values;
    }
  }

  return value;
};

const renderKeyValuePairs = (data: Record<string, any>) => (
  <Grid container spacing={1} sx={{ mt: 1 }}>
    {Object.entries(data)
      .slice(0, 12)
      .map(([label, value]) => (
        <Grid item xs={12} sm={6} md={4} key={label}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2">{String(value ?? '—')}</Typography>
        </Grid>
      ))}
  </Grid>
);

const formatCellValue = (value: any, column: string): string => {
  if (value === null || value === undefined) return '—';
  
  const strValue = String(value);
  
  // Format currency values
  if (column.toLowerCase().includes('value') || 
      column.toLowerCase().includes('amount') || 
      column.toLowerCase().includes('total') ||
      column.toLowerCase().includes('payable') ||
      (typeof value === 'number' && !isNaN(value) && Math.abs(value) > 10)) {
    const numValue = parseFloat(strValue);
    if (!isNaN(numValue)) {
      return `$${numValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
  
  // Format dates
  if (strValue.includes('/Date(') || strValue.includes('T') && strValue.includes('Z')) {
    try {
      const date = new Date(strValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-AU');
      }
    } catch (e) {
      // Keep original value if parsing fails
    }
  }
  
  // Format percentages
  if (column.toLowerCase().includes('rate') && typeof value === 'number') {
    return `${value}%`;
  }
  
  return strValue;
};

const renderGenericTable = (rows: any[], prefix: string) => {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No records available.
      </Typography>
    );
  }

  const uniqueRows = Array.from(
    new Map(
      rows.map((row, index) => [JSON.stringify(row) + index, row || {}]),
    ).values(),
  );

  const columns = Array.from(
    new Set(
      uniqueRows.reduce<string[]>((acc, row) => {
        const keys = Object.keys(row || {});
        return acc.concat(keys);
      }, []),
    ),
  ).slice(0, 8);

  if (!columns.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unable to determine columns for this dataset.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell 
                key={column}
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'grey.100'
                }}
              >
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {uniqueRows.slice(0, 50).map((row, index) => (
            <TableRow 
              hover 
              key={`${prefix}-${index}`}
              sx={{
                backgroundColor: row.Type === 'Section' ? 'grey.50' : 'inherit'
              }}
            >
              {columns.map((column) => (
                <TableCell 
                  key={column}
                  sx={{
                    fontWeight: row.Type === 'Section' ? 'bold' : 'normal',
                    fontFamily: column.toLowerCase().includes('value') || column.toLowerCase().includes('amount') ? 'monospace' : 'inherit'
                  }}
                >
                  {formatCellValue(row?.[column], column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const renderJsonPreview = (value: any) => (
  <Box
    sx={{
      mt: 1,
      maxHeight: 240,
      overflow: 'auto',
      backgroundColor: 'grey.100',
      borderRadius: 1,
      p: 2,
      fontFamily: 'monospace',
      fontSize: '0.75rem',
      whiteSpace: 'pre',
    }}
  >
    {JSON.stringify(value, null, 2)}
  </Box>
);

const renderSection = (label: string, value: any) => {
  if (value === undefined || value === null) {
    return null;
  }

  const flattened = flattenArray(normalizeXeroValue(value));
  const normalized = flattened.length === 1 ? flattened[0] : flattened;

  if (Array.isArray(normalized)) {
    return (
      <Box key={label} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {renderGenericTable(normalized, label)}
      </Box>
    );
  }

  if (isPlainObject(normalized)) {
    // Check if this is a complex nested object that should be displayed as a table
    const hasNestedArrays = Object.values(normalized).some(val => Array.isArray(val));
    const hasComplexNestedObjects = Object.values(normalized).some(val => 
      val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 5
    );

    if (hasNestedArrays || hasComplexNestedObjects) {
      // For complex objects, try to extract tabular data
      const tableData = [];
      Object.entries(normalized).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              tableData.push({ 'Type': key, 'Index': index, ...item });
            } else {
              tableData.push({ 'Type': key, 'Index': index, 'Value': item });
            }
          });
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          tableData.push({ 'Type': key, ...value });
        } else {
          tableData.push({ 'Type': key, 'Value': value });
        }
      });

      if (tableData.length > 0) {
        return (
          <Box key={label} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {label}
            </Typography>
            {renderGenericTable(tableData, label)}
          </Box>
        );
      }
    }

    return (
      <Box key={label} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {renderKeyValuePairs(normalized)}
      </Box>
    );
  }

  return (
    <Box key={label} sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2">{String(normalized)}</Typography>
    </Box>
  );
};

export const renderXeroDataPreview = (
  sections: Array<{ label: string; value: any }>,
) => (
  <>
    {sections
      .map(({ label, value }) => renderSection(label, value))
      .filter(Boolean)}
  </>
);
