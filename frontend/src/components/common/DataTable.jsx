import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Typography,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InboxIcon from '@mui/icons-material/Inbox';
import { debounce } from '../../utils/helpers';

const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  total = 0,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSearch,
  searchPlaceholder = 'Search...',
  actions = [],
  toolbar,
  rowsPerPageOptions = [5, 10, 25, 50],
  stickyHeader = false,
  dense = false,
  getRowId = (row) => row.id,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const debouncedSearch = useRef(
    debounce((val) => {
      if (onSearch) onSearch(val);
    }, 400)
  ).current;

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const renderCell = (row, col) => {
    if (col.render) return col.render(row[col.field], row);
    const value = col.field ? row[col.field] : null;
    if (value === null || value === undefined) return '-';
    return value;
  };

  const skeletonRows = Array.from({ length: pageSize > 5 ? 5 : pageSize }, (_, i) => i);

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      {(onSearch || toolbar) && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {onSearch && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              sx={{ minWidth: 240, maxWidth: 360 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
        </Box>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field || col.id}
                  align={col.align || 'left'}
                  sx={{
                    minWidth: col.minWidth,
                    width: col.width,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    bgcolor: '#F5F7FA',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    bgcolor: '#F5F7FA',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              skeletonRows.map((idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.field || col.id}>
                      <Skeleton variant="text" height={20} />
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <Skeleton variant="text" height={20} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  sx={{ py: 8 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">
                      No records found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  hover
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.field || col.id}
                      align={col.align || 'left'}
                      sx={{ py: 1.25, fontSize: '0.875rem' }}
                    >
                      {renderCell(row, col)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell align="right" sx={{ py: 1, whiteSpace: 'nowrap' }}>
                      {actions.map((action) => {
                        if (action.hidden && action.hidden(row)) return null;
                        return (
                          <Tooltip key={action.label} title={action.label}>
                            <IconButton
                              size="small"
                              onClick={() => action.onClick(row)}
                              color={action.color || 'default'}
                              disabled={action.disabled && action.disabled(row)}
                              sx={{ ml: 0.5 }}
                            >
                              {action.icon}
                            </IconButton>
                          </Tooltip>
                        );
                      })}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(onPageChange || onPageSizeChange) && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => onPageChange && onPageChange(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) =>
            onPageSizeChange && onPageSizeChange(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={rowsPerPageOptions}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': { px: 2 },
          }}
        />
      )}
    </Paper>
  );
};

export default DataTable;
