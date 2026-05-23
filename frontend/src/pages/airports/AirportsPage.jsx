import React, { useEffect, useCallback, useState } from 'react';
import { Box, Chip, LinearProgress, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAirports,
  deleteAirport,
  setPage,
  setPageSize,
  setSearch,
} from '../../store/slices/airportsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatLiters, getStockPercentage, getStockLevelColor } from '../../utils/helpers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const AirportsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, currentPage, pageSize } = useSelector((state) => state.airports);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, airport: null, loading: false });

  const loadAirports = useCallback(() => {
    dispatch(fetchAirports({ page: currentPage + 1, page_size: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    loadAirports();
  }, [loadAirports]);

  const handleDelete = async () => {
    if (!deleteDialog.airport) return;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const result = await dispatch(deleteAirport(deleteDialog.airport.id));
    setDeleteDialog({ open: false, airport: null, loading: false });
    if (deleteAirport.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'Airport deleted successfully', severity: 'success' }));
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Delete failed', severity: 'error' }));
    }
  };

  const columns = [
    { field: 'name', label: 'Airport Name', minWidth: 180 },
    {
      field: 'code',
      label: 'Code',
      minWidth: 80,
      render: (val) => (
        <Chip label={val} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
      ),
    },
    { field: 'city', label: 'City', minWidth: 120, render: (val) => val || '-' },
    { field: 'country', label: 'Country', minWidth: 120, render: (val) => val || 'India' },
    {
      field: 'fuel_storage_capacity',
      label: 'Capacity',
      minWidth: 130,
      render: (val) => formatLiters(val),
    },
    {
      id: 'stock',
      label: 'Current Stock',
      minWidth: 180,
      render: (_, row) => {
        const pct = getStockPercentage(row.current_stock, row.fuel_storage_capacity);
        const color = getStockLevelColor(row.current_stock, row.fuel_storage_capacity);
        return (
          <Box sx={{ minWidth: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formatLiters(row.current_stock)}
              </Typography>
              <Typography variant="caption" fontWeight={600} color={`${color}.main`}>
                {pct.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      color: 'primary',
      onClick: (row) => navigate(`/airports/${row.id}/edit`),
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      color: 'error',
      onClick: (row) => setDeleteDialog({ open: true, airport: row, loading: false }),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Airports"
        subtitle="Manage airport locations and fuel storage"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Airports' }]}
        action={{
          label: 'Add Airport',
          icon: <AddIcon />,
          onClick: () => navigate('/airports/new'),
        }}
      />

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => dispatch(setPage(p))}
        onPageSizeChange={(ps) => { dispatch(setPageSize(ps)); dispatch(setPage(0)); }}
        onSearch={(val) => { dispatch(setSearch(val)); dispatch(setPage(0)); }}
        searchPlaceholder="Search airports..."
        actions={actions}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Airport"
        message={`Are you sure you want to delete "${deleteDialog.airport?.name}"? This will affect all associated stock data.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, airport: null, loading: false })}
      />
    </Box>
  );
};

export default AirportsPage;
