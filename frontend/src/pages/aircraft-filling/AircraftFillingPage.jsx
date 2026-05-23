import React, { useEffect, useCallback, useState } from 'react';
import { Box, Button, Tooltip, IconButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAircraftFillings, deleteAircraftFilling, setPage, setPageSize,
} from '../../store/slices/aircraftFillingSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatLiters, formatDateTime, downloadBlob } from '../../utils/helpers';
import { aircraftFillingApi } from '../../api/aircraftFillingApi';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const AircraftFillingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, currentPage, pageSize } = useSelector((s) => s.aircraftFilling);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, record: null, loading: false });
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchAircraftFillings({ page: currentPage + 1, page_size: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteDialog.record) return;
    setDeleteDialog((p) => ({ ...p, loading: true }));
    const result = await dispatch(deleteAircraftFilling(deleteDialog.record.id));
    setDeleteDialog({ open: false, record: null, loading: false });
    if (deleteAircraftFilling.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'Record deleted', severity: 'success' }));
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Delete failed', severity: 'error' }));
    }
  };

  const handleDownloadPdf = async (row) => {
    setPdfLoadingId(row.id);
    try {
      const response = await aircraftFillingApi.downloadPdf(row.id);
      downloadBlob(response.data, `filling-receipt-${row.filling_id || row.id}.pdf`);
      dispatch(showSnackbar({ message: 'Receipt downloaded', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Download failed', severity: 'error' }));
    } finally {
      setPdfLoadingId(null);
    }
  };

  const columns = [
    { field: 'filling_id', label: 'Filling ID', minWidth: 110, render: (v) => v || '-' },
    { field: 'filling_datetime', label: 'Date/Time', minWidth: 160, render: (v) => formatDateTime(v) },
    { field: 'aircraft', label: 'Aircraft', minWidth: 150, render: (_, row) => row.aircraft ? `${row.aircraft.aircraft_number}${row.aircraft.airline_name ? ' / ' + row.aircraft.airline_name : ''}` : '-' },
    { field: 'airport', label: 'Airport', minWidth: 160, render: (_, row) => row.airport ? `${row.airport.airport_name} (${row.airport.airport_code})` : '-' },
    { field: 'flight_number', label: 'Flight No.', minWidth: 100, render: (v) => v || '-' },
    { field: 'quantity_filled', label: 'Quantity', minWidth: 110, align: 'right', render: (v) => formatLiters(v) },
    { field: 'fuel_rate', label: 'Rate/L', minWidth: 90, align: 'right', render: (v) => formatCurrency(v) },
    { field: 'total_cost', label: 'Total Cost', minWidth: 120, align: 'right', render: (v) => <Box component="span" sx={{ fontWeight: 700 }}>{formatCurrency(v)}</Box> },
  ];

  const actions = [
    { label: 'View', icon: <VisibilityIcon fontSize="small" />, color: 'default', onClick: (r) => navigate(`/aircraft-filling/${r.id}`) },
    { label: 'Download Receipt', icon: <PictureAsPdfIcon fontSize="small" />, color: 'secondary', onClick: handleDownloadPdf },
    { label: 'Edit', icon: <EditIcon fontSize="small" />, color: 'primary', onClick: (r) => navigate(`/aircraft-filling/${r.id}/edit`) },
    { label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error', onClick: (r) => setDeleteDialog({ open: true, record: r, loading: false }) },
  ];

  return (
    <Box>
      <PageHeader
        title="Aircraft Filling"
        subtitle="Fuel dispensing records for aircraft"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Aircraft Filling' }]}
        action={{ label: 'New Filling', icon: <AddIcon />, onClick: () => navigate('/aircraft-filling/new') }}
      />
      <DataTable
        columns={columns} rows={items} loading={loading} total={total}
        page={currentPage} pageSize={pageSize}
        onPageChange={(p) => dispatch(setPage(p))}
        onPageSizeChange={(ps) => { dispatch(setPageSize(ps)); dispatch(setPage(0)); }}
        onSearch={() => {}}
        searchPlaceholder="Search fillings..."
        actions={actions}
      />
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Filling Record"
        message={`Delete filling record #${deleteDialog.record?.filling_id}?`}
        variant="danger" confirmLabel="Delete" loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, record: null, loading: false })}
      />
    </Box>
  );
};

export default AircraftFillingPage;
