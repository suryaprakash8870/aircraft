import React, { useEffect, useCallback, useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAircrafts, deleteAircraft, setPage, setPageSize, setSearch,
} from '../../store/slices/aircraftsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatLiters, getStatusColor } from '../../utils/helpers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const AircraftsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, currentPage, pageSize } = useSelector((s) => s.aircrafts);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, aircraft: null, loading: false });

  const load = useCallback(() => {
    dispatch(fetchAircrafts({ page: currentPage + 1, page_size: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteDialog.aircraft) return;
    setDeleteDialog((p) => ({ ...p, loading: true }));
    const result = await dispatch(deleteAircraft(deleteDialog.aircraft.id));
    setDeleteDialog({ open: false, aircraft: null, loading: false });
    if (deleteAircraft.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'Aircraft deleted', severity: 'success' }));
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Delete failed', severity: 'error' }));
    }
  };

  const columns = [
    { field: 'aircraft_number', label: 'Aircraft No.', minWidth: 130 },
    { field: 'aircraft_model', label: 'Model', minWidth: 130, render: (v) => v || '-' },
    { field: 'airline_name', label: 'Airline', minWidth: 150, render: (v) => v || '-' },
    { field: 'fuel_capacity', label: 'Fuel Capacity', minWidth: 130, align: 'right', render: (v) => formatLiters(v) },
    {
      field: 'status', label: 'Status', minWidth: 110,
      render: (v) => (
        <Chip label={v || 'active'} size="small" color={getStatusColor(v)}
          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem', textTransform: 'capitalize' }} />
      ),
    },
  ];

  const actions = [
    { label: 'Edit', icon: <EditIcon fontSize="small" />, color: 'primary', onClick: (r) => navigate(`/aircrafts/${r.id}/edit`) },
    { label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error', onClick: (r) => setDeleteDialog({ open: true, aircraft: r, loading: false }) },
  ];

  return (
    <Box>
      <PageHeader
        title="Aircrafts"
        subtitle="Manage aircraft fleet registry"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Aircrafts' }]}
        action={{ label: 'Add Aircraft', icon: <AddIcon />, onClick: () => navigate('/aircrafts/new') }}
      />
      <DataTable
        columns={columns} rows={items} loading={loading} total={total}
        page={currentPage} pageSize={pageSize}
        onPageChange={(p) => dispatch(setPage(p))}
        onPageSizeChange={(ps) => { dispatch(setPageSize(ps)); dispatch(setPage(0)); }}
        onSearch={(v) => { dispatch(setSearch(v)); dispatch(setPage(0)); }}
        searchPlaceholder="Search aircraft..."
        actions={actions}
      />
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Aircraft"
        message={`Delete aircraft "${deleteDialog.aircraft?.aircraft_number}"?`}
        variant="danger" confirmLabel="Delete" loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, aircraft: null, loading: false })}
      />
    </Box>
  );
};

export default AircraftsPage;
