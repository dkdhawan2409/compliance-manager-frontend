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

const isPrimitive = (value: any) =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const mergeKey = (prefix: string, key: string) => (prefix ? `${prefix} › ${key}` : key);

const flattenArray = (value: any): any[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenArray(item));
  }
  return [value];
};

const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  if (!isPlainObject(obj)) {
    return { [prefix || 'Value']: obj };
  }

  return Object.entries(obj).reduce<Record<string, any>>((acc, [key, value]) => {
    const nextKey = mergeKey(prefix, key);
    if (isPlainObject(value)) {
      Object.assign(acc, flattenObject(value, nextKey));
    } else if (Array.isArray(value)) {
      if (value.every(isPrimitive) && value.length <= 8) {
        acc[nextKey] = value.join(', ');
      } else {
        acc[nextKey] = `${value.length} items`;
      }
    } else {
      acc[nextKey] = value;
    }
    return acc;
  }, {});
};

const normalizeRow = (row: any): Record<string, any> => {
  if (!isPlainObject(row)) {
    return { Value: row };
  }
  return flattenObject(row);
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

const flattenReportRows = (rows: any[]): Record<string, any>[] => {
  const items: Record<string, any>[] = [];

  if (!Array.isArray(rows)) {
    return items;
  }

  rows.forEach((row) => {
    if (!row) return;

    if (row.RowType === 'Section' && Array.isArray(row.Rows)) {
      if (row.Title) {
        items.push({ Section: row.Title });
      }
      items.push(...flattenReportRows(row.Rows));
      return;
    }

    if (Array.isArray(row.Cells)) {
      const record: Record<string, any> = {};
      row.Cells.forEach((cell: any, index: number) => {
        const columnKey =
          index === 0
            ? 'Description'
            : row.Cells.length === 2 && index === row.Cells.length - 1
            ? 'Value'
            : `Column ${index + 1}`;

        if (record[columnKey] !== undefined) {
          record[`${columnKey} (${index + 1})`] = cell?.Value ?? '';
        } else {
          record[columnKey] = cell?.Value ?? '';
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

const formatCellValue = (value: any, column: string): string => {
  if (value === null || value === undefined) return '—';

  const strValue = String(value);
  const lowerColumn = column.toLowerCase();

  if (
    lowerColumn.includes('value') ||
    lowerColumn.includes('amount') ||
    lowerColumn.includes('total') ||
    lowerColumn.includes('payable')
  ) {
    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      return numValue.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
      });
    }
  }

  if (strValue.includes('/Date(') || (strValue.includes('T') && strValue.includes('Z'))) {
    const date = new Date(strValue);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-AU');
    }
  }

  if (lowerColumn.includes('rate') && typeof value === 'number') {
    return `${value}%`;
  }

  return strValue;
};

const renderPrimitiveGrid = (entries: Array<[string, any]>) => {
  if (!entries.length) return null;

  return (
    <Grid container spacing={1} sx={{ mt: 1 }}>
      {entries.map(([label, value]) => (
        <Grid item xs={12} sm={6} md={4} key={label}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2">{formatCellValue(value, label)}</Typography>
        </Grid>
      ))}
    </Grid>
  );
};

const renderGenericTable = (rows: any[], prefix: string) => {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No records available.
      </Typography>
    );
  }

  const normalizedRows = rows.map((row) => normalizeRow(row));
  const uniqueRows = Array.from(
    new Map(
      normalizedRows.map((row, index) => [JSON.stringify(row) + index, row]),
    ).values(),
  );

  const columns = Array.from(
    new Set(
      uniqueRows.reduce<string[]>((acc, row) => {
        const keys = Object.keys(row || {});
        return acc.concat(keys);
      }, []),
    ),
  ).slice(0, 12);

  if (!columns.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unable to determine columns for this dataset.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 420 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column}
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: 'grey.100',
                }}
              >
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {uniqueRows.slice(0, 50).map((row, index) => (
            <TableRow hover key={`${prefix}-${index}`}>
              {columns.map((column) => (
                <TableCell key={column}>
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

const renderSection = (label: string, value: any): React.ReactNode => {
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
    const entries = Object.entries(normalized);
    const primitives = entries.filter(([, v]) => isPrimitive(v));
    const complex = entries.filter(([, v]) => !isPrimitive(v));

    return (
      <Box key={label} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {renderPrimitiveGrid(primitives)}
        {complex.map(([childLabel, childValue]) =>
          renderSection(`${label} › ${childLabel}`, childValue),
        )}
      </Box>
    );
  }

  return (
    <Box key={label} sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2">{formatCellValue(normalized, label)}</Typography>
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
