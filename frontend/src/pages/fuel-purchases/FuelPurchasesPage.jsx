import React, { useEffect, useCallback, useState } from 'react';
import {
  Box, Chip, Grid, TextField, MenuItem, Button, Tooltip, IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchFuelPurchases, deleteFuelPurchase, setPage, setPageSize, setFilters,
} from '../../store/slices/fuelPurchasesSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { fetchAirports } from '../../store/slices/airportsSlice';
import { fetchFuelAgents } from '../../store/slices/fuelAgentsSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatLiters, formatDate, getStatusColor, downloadBlob } from '../../utils/helpers';
import { fuelPurchasesApi } from '../../api/fuelPurchasesApi';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';

const paymentStatusOptions = [
  { value: '', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
];

const FuelPurchasesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, currentPage, pageSize, filters } = useSelector((s) => s.fuelPurchases);
  const { items: airports } = useSelector((s) => s.airports);
  const { items: agents } = useSelector((s) => s.fuelAgents);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, purchase: null, loading: false });
  const [pdfLoading, setPdfLoading] = useState(null);

  useEffect(() => {
    dispatch(fetchAirports({ page: 1, page_size: 100 }));
    dispatch(fetchFuelAgents({ page: 1, page_size: 100 }));
  }, [dispatch]);

  const loadPurchases = useCallback(() => {
    dispatch(fetchFuelPurchases({
      page: currentPage + 1, page_size: pageSize,
      search: filters.search || undefined,
      airport: filters.airport || undefined,
      agent: filters.agent || undefined,
      payment_status: filters.paymentStatus || undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    }));
  }, [dispatch, currentPage, pageSize, filters]);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  const handleDelete = async () => {
    if (!deleteDialog.purchase) return;
    setDeleteDialog((p) => ({ ...p, loading: true }));
    const result = await dispatch(deleteFuelPurchase(deleteDialog.purchase.id));
    setDeleteDialog({ open: false, purchase: null, loading: false });
    if (deleteFuelPurchase.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'Purchase deleted', severity: 'success' }));
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Delete failed', severity: 'error' }));
    }
  };

  const handleDownloadPdf = async (row) => {
    setPdfLoading(row.id);
    try {
      const response = await fuelPurchasesApi.downloadPdf(row.id);
      downloadBlob(response.data, `purchase-${row.id}.pdf`);
      dispatch(showSnackbar({ message: 'PDF downloaded', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'PDF download failed', severity: 'error' }));
    } finally {
      setPdfLoading(null);
    }
  };

  const columns = [
    { field: 'purchase_id', label: 'Purchase ID', minWidth: 120, render: (val) => val || '-' },
    { field: 'purchase_date', label: 'Date', minWidth: 110, render: (val) => formatDate(val) },
    { field: 'fuel_agent', label: 'Fuel Agent', minWidth: 150, render: (_, row) => row.fuel_agent?.agent_name || '-' },
    { field: 'airport', label: 'Airport', minWidth: 160, render: (_, row) => row.airport ? `${row.airport.airport_name} (${row.airport.airport_code})` : '-' },
    {
      field: 'fuel_type',
      label: 'Fuel Type',
      minWidth: 100,
      render: (val) => (
        <Chip label={val || 'ATF'} size="small" color="info" sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }} />
      ),
    },
    { field: 'quantity_purchased', label: 'Quantity', minWidth: 110, align: 'right', render: (val) => formatLiters(val) },
    { field: 'purchase_rate', label: 'Rate/L', minWidth: 100, align: 'right', render: (val) => formatCurrency(val) },
    { field: 'total_amount', label: 'Total Amount', minWidth: 130, align: 'right', render: (val) => <Box component="span" sx={{ fontWeight: 600 }}>{formatCurrency(val)}</Box> },
    {
      field: 'payment_status',
      label: 'Payment',
      minWidth: 110,
      render: (val) => (
        <Chip label={val || 'pending'} size="small" color={getStatusColor(val)} sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem', textTransform: 'capitalize' }} />
      ),
    },
  ];

  const actions = [
    { label: 'View', icon: <VisibilityIcon fontSize="small" />, color: 'default', onClick: (row) => navigate(`/fuel-purchases/${row.id}`) },
    { label: 'Download PDF', icon: <PictureAsPdfIcon fontSize="small" />, color: 'secondary', onClick: handleDownloadPdf },
    { label: 'Edit', icon: <EditIcon fontSize="small" />, color: 'primary', onClick: (row) => navigate(`/fuel-purchases/${row.id}/edit`) },
    { label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error', onClick: (row) => setDeleteDialog({ open: true, purchase: row, loading: false }) },
  ];

  const filterToolbar = (
    <Grid container spacing={1.5} alignItems="center">
      <Grid item xs={12} sm="auto">
        <TextField
          select size="small" label="Airport" value={filters.airport} sx={{ minWidth: 140 }}
          onChange={(e) => { dispatch(setFilters({ airport: e.target.value })); dispatch(setPage(0)); }}
        >
          <MenuItem value="">All Airports</MenuItem>
          {airports.map((a) => <MenuItem key={a.id} value={a.id}>{a.airport_name} ({a.airport_code})</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm="auto">
        <TextField
          select size="small" label="Agent" value={filters.agent} sx={{ minWidth: 140 }}
          onChange={(e) => { dispatch(setFilters({ agent: e.target.value })); dispatch(setPage(0)); }}
        >
          <MenuItem value="">All Agents</MenuItem>
          {agents.map((a) => <MenuItem key={a.id} value={a.id}>{a.agent_name}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm="auto">
        <TextField
          select size="small" label="Payment Status" value={filters.paymentStatus} sx={{ minWidth: 140 }}
          onChange={(e) => { dispatch(setFilters({ paymentStatus: e.target.value })); dispatch(setPage(0)); }}
        >
          {paymentStatusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <PageHeader
        title="Fuel Purchases"
        subtitle="Manage fuel procurement records"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Fuel Purchases' }]}
        action={{ label: 'Add Purchase', icon: <AddIcon />, onClick: () => navigate('/fuel-purchases/new') }}
      />

      <Box sx={{ mb: 2 }}>{filterToolbar}</Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => dispatch(setPage(p))}
        onPageSizeChange={(ps) => { dispatch(setPageSize(ps)); dispatch(setPage(0)); }}
        onSearch={(val) => { dispatch(setFilters({ search: val })); dispatch(setPage(0)); }}
        searchPlaceholder="Search purchases..."
        actions={actions}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Purchase"
        message={`Delete purchase record #${deleteDialog.purchase?.purchase_id}? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, purchase: null, loading: false })}
      />
    </Box>
  );
};

export default FuelPurchasesPage;
