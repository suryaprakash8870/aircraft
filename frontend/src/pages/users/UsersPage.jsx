import React, { useEffect, useCallback, useState } from 'react';
import { Box, Chip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchUsers, deleteUser, setPage, setPageSize, setSearch, setRoleFilter,
} from '../../store/slices/usersSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/helpers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const roleColors = { admin: 'error', operator: 'primary', viewer: 'success' };
const statusColors = { active: 'success', inactive: 'error', suspended: 'warning' };

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, currentPage, pageSize, roleFilter } = useSelector((s) => s.users);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null, loading: false });

  const load = useCallback(() => {
    dispatch(fetchUsers({ page: currentPage + 1, page_size: pageSize, role: roleFilter || undefined }));
  }, [dispatch, currentPage, pageSize, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    setDeleteDialog((p) => ({ ...p, loading: true }));
    const result = await dispatch(deleteUser(deleteDialog.user.id));
    setDeleteDialog({ open: false, user: null, loading: false });
    if (deleteUser.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'User deleted', severity: 'success' }));
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Delete failed', severity: 'error' }));
    }
  };

  const columns = [
    { field: 'full_name', label: 'Full Name', minWidth: 160 },
    { field: 'email', label: 'Email', minWidth: 200 },
    { field: 'username', label: 'Username', minWidth: 130 },
    {
      field: 'role', label: 'Role', minWidth: 110,
      render: (v) => (
        <Chip
          label={v} size="small" color={roleColors[v] || 'default'}
          sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem', textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'status', label: 'Status', minWidth: 100,
      render: (v) => (
        <Chip
          label={v || 'active'} size="small" color={statusColors[v] || 'success'}
          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem', textTransform: 'capitalize' }}
        />
      ),
    },
    { field: 'created_at', label: 'Created', minWidth: 120, render: (v) => formatDate(v) },
  ];

  const actions = [
    { label: 'Edit', icon: <EditIcon fontSize="small" />, color: 'primary', onClick: (r) => navigate(`/users/${r.id}/edit`) },
    { label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: 'error', onClick: (r) => setDeleteDialog({ open: true, user: r, loading: false }) },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage system users and access"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
        action={{ label: 'Add User', icon: <AddIcon />, onClick: () => navigate('/users/new') }}
      />

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          size="small" value={roleFilter} exclusive
          onChange={(_, v) => { dispatch(setRoleFilter(v || '')); dispatch(setPage(0)); }}
          sx={{ '& .MuiToggleButton-root': { px: 2, py: 0.5, fontSize: '0.8125rem', textTransform: 'none', borderRadius: 1 } }}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="admin">Admin</ToggleButton>
          <ToggleButton value="operator">Operator</ToggleButton>
          <ToggleButton value="viewer">Viewer</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <DataTable
        columns={columns} rows={items} loading={loading} total={total}
        page={currentPage} pageSize={pageSize}
        onPageChange={(p) => dispatch(setPage(p))}
        onPageSizeChange={(ps) => { dispatch(setPageSize(ps)); dispatch(setPage(0)); }}
        onSearch={(v) => { dispatch(setSearch(v)); dispatch(setPage(0)); }}
        searchPlaceholder="Search users..."
        actions={actions}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete User"
        message={`Delete user "${deleteDialog.user?.full_name || deleteDialog.user?.username}"? This cannot be undone.`}
        variant="danger" confirmLabel="Delete" loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, user: null, loading: false })}
      />
    </Box>
  );
};

export default UsersPage;
