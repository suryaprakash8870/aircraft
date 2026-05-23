import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchFuelAgents,
  deleteFuelAgent,
  setPage,
  setPageSize,
  setSearch,
  setStatusFilter,
} from '../../store/slices/fuelAgentsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getStatusColor } from '../../utils/helpers';

const FuelAgentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, currentPage, pageSize, search, statusFilter } = useSelector(
    (state) => state.fuelAgents
  );
  const [deleteDialog, setDeleteDialog] = useState({ open: false, agent: null, loading: false });

  const loadAgents = useCallback(() => {
    dispatch(
      fetchFuelAgents({
        page: currentPage + 1,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
      })
    );
  }, [dispatch, currentPage, pageSize, search, statusFilter]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleDelete = async () => {
    if (!deleteDialog.agent) return;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    const result = await dispatch(deleteFuelAgent(deleteDialog.agent.id));
    setDeleteDialog({ open: false, agent: null, loading: false });
    if (deleteFuelAgent.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'Fuel agent deleted successfully', severity: 'success' }));
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Delete failed', severity: 'error' }));
    }
  };

  const columns = [
    { field: 'agent_name', label: 'Agent Name', minWidth: 160 },
    { field: 'company_name', label: 'Company', minWidth: 160 },
    { field: 'contact_person', label: 'Contact Person', minWidth: 140 },
    { field: 'phone', label: 'Phone', minWidth: 120 },
    { field: 'email', label: 'Email', minWidth: 160 },
    {
      field: 'gst_number',
      label: 'GST No.',
      minWidth: 140,
      render: (val) => val || '-',
    },
    {
      field: 'status',
      label: 'Status',
      minWidth: 100,
      render: (val) => (
        <Chip
          label={val || 'Active'}
          size="small"
          color={getStatusColor(val)}
          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
        />
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      color: 'primary',
      onClick: (row) => navigate(`/fuel-agents/${row.id}/edit`),
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      color: 'error',
      onClick: (row) => setDeleteDialog({ open: true, agent: row, loading: false }),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Fuel Agents"
        subtitle="Manage fuel supplier agents"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Fuel Agents' }]}
        action={{
          label: 'Add Agent',
          icon: <AddIcon />,
          onClick: () => navigate('/fuel-agents/new'),
        }}
      />

      {/* Status Filter */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          value={statusFilter}
          exclusive
          onChange={(e, val) => {
            dispatch(setStatusFilter(val || ''));
            dispatch(setPage(0));
          }}
          sx={{ '& .MuiToggleButton-root': { px: 2, py: 0.5, fontSize: '0.8125rem', textTransform: 'none', borderRadius: 1 } }}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
        searchPlaceholder="Search by name or company..."
        actions={actions}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Fuel Agent"
        message={`Are you sure you want to delete "${deleteDialog.agent?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, agent: null, loading: false })}
      />
    </Box>
  );
};

export default FuelAgentsPage;
