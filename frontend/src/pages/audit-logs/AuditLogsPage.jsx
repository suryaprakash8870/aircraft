import React, { useEffect, useCallback } from 'react';
import {
  Box, Chip, Grid, TextField, MenuItem, Button,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAuditLogs, setPage, setPageSize, setFilters, clearFilters,
} from '../../store/slices/auditLogsSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils/helpers';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

const actionColors = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'error',
  LOGIN: 'info',
  LOGOUT: 'default',
  EXPORT: 'secondary',
  VIEW: 'default',
};

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'EXPORT', label: 'Export' },
];

const AuditLogsPage = () => {
  const dispatch = useDispatch();
  const { items, total, loading, currentPage, pageSize, filters } = useSelector((s) => s.auditLogs);

  const load = useCallback(() => {
    dispatch(fetchAuditLogs({
      page: currentPage + 1, page_size: pageSize,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      action: filters.action || undefined,
      user: filters.user || undefined,
    }));
  }, [dispatch, currentPage, pageSize, filters]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      field: 'created_at', label: 'Date / Time', minWidth: 160,
      render: (v) => formatDateTime(v),
    },
    { field: 'user_name', label: 'User', minWidth: 140 },
    {
      field: 'action', label: 'Action', minWidth: 110,
      render: (v) => (
        <Chip
          label={v} size="small" color={actionColors[v?.toUpperCase()] || 'default'}
          sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
        />
      ),
    },
    {
      field: 'entity_type', label: 'Entity Type', minWidth: 140,
      render: (v) => v ? <Chip label={v} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /> : '-',
    },
    { field: 'entity_id', label: 'Entity ID', minWidth: 100, render: (v) => v || '-' },
    { field: 'ip_address', label: 'IP Address', minWidth: 120, render: (v) => v || '-' },
    { field: 'description', label: 'Description', minWidth: 200, render: (v) => v || '-' },
  ];

  const filterBar = (
    <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
      <Grid item xs={12} sm={6} md="auto">
        <TextField
          size="small" label="From Date" type="date" value={filters.dateFrom}
          onChange={(e) => { dispatch(setFilters({ dateFrom: e.target.value })); dispatch(setPage(0)); }}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md="auto">
        <TextField
          size="small" label="To Date" type="date" value={filters.dateTo}
          onChange={(e) => { dispatch(setFilters({ dateTo: e.target.value })); dispatch(setPage(0)); }}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md="auto">
        <TextField
          select size="small" label="Action" value={filters.action} sx={{ minWidth: 140 }}
          onChange={(e) => { dispatch(setFilters({ action: e.target.value })); dispatch(setPage(0)); }}
        >
          {actionOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md="auto">
        <TextField
          size="small" label="User" value={filters.user} sx={{ minWidth: 140 }}
          onChange={(e) => { dispatch(setFilters({ user: e.target.value })); dispatch(setPage(0)); }}
          placeholder="Filter by username"
        />
      </Grid>
      <Grid item xs="auto">
        <Button
          size="small" variant="outlined" startIcon={<FilterListOffIcon />}
          onClick={() => { dispatch(clearFilters()); dispatch(setPage(0)); }}
          sx={{ borderColor: 'divider', color: 'text.secondary' }}
        >
          Clear
        </Button>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle="System activity and change history"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Audit Logs' }]}
      />

      {filterBar}

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => dispatch(setPage(p))}
        onPageSizeChange={(ps) => { dispatch(setPageSize(ps)); dispatch(setPage(0)); }}
        searchPlaceholder="Search logs..."
      />
    </Box>
  );
};

export default AuditLogsPage;
