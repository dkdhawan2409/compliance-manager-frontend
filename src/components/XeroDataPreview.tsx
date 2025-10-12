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
      items.push(...flattenReportRows(row.Rows, depth + 1));
      return;
    }

    if (Array.isArray(row.Cells)) {
      const record: Record<string, any> = {};
      row.Cells.forEach((cell: any, index: number) => {
        const key =
          index === 0
            ? 'Description'
            : row.Cells.length === 2 && index === row.Cells.length - 1
            ? 'Value'
            : `Column ${index + 1}`;
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

const renderGenericTable = (rows: any[], prefix: string) => {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No records available.
      </Typography>
    );
  }

  const columns = Array.from(
    new Set(
      rows.reduce<string[]>((acc, row) => {
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
    <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(0, 25).map((row, index) => (
            <TableRow hover key={`${prefix}-${index}`}>
              {columns.map((column) => (
                <TableCell key={column}>{String(row?.[column] ?? '—')}</TableCell>
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

  const normalized = normalizeXeroValue(value);

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
    return (
      <Box key={label} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {renderKeyValuePairs(normalized)}
        {renderJsonPreview(normalized)}
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
