import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, TextField, Button, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, updateUser, fetchUserById, clearCurrentItem } from '../../store/slices/usersSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import PageHeader from '../../components/common/PageHeader';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const defaultValues = {
  full_name: '', email: '', username: '', password: '', role: 'operator', status: 'active',
};

const UserFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, error } = useSelector((s) => s.users);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm({ defaultValues });

  useEffect(() => {
    if (isEdit) dispatch(fetchUserById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentItem) {
      reset({
        full_name: currentItem.full_name || '',
        email: currentItem.email || '',
        username: currentItem.username || '',
        password: '',
        role: currentItem.role || 'operator',
        status: currentItem.status || 'active',
      });
    }
  }, [currentItem, isEdit, reset]);

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (isEdit && !payload.password) delete payload.password;

    const result = isEdit
      ? await dispatch(updateUser({ id, data: payload }))
      : await dispatch(createUser(payload));

    if (createUser.fulfilled.match(result) || updateUser.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: isEdit ? 'User updated!' : 'User created!', severity: 'success' }));
      navigate('/users');
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Operation failed', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Add User'}
        subtitle={isEdit ? 'Update user account details' : 'Create a new system user'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/users'), color: 'inherit' }}
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Full Name *"
                  {...register('full_name', { required: 'Full name is required' })}
                  error={!!errors.full_name} helperText={errors.full_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Email Address *" type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                  })}
                  error={!!errors.email} helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Username *"
                  {...register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, underscores' },
                  })}
                  error={!!errors.username} helperText={errors.username?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
                  type="password"
                  {...register('password', {
                    required: isEdit ? false : 'Password is required',
                    minLength: isEdit ? undefined : { value: 8, message: 'Minimum 8 characters' },
                  })}
                  error={!!errors.password} helperText={errors.password?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="role" control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Role">
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="operator">Operator</MenuItem>
                      <MenuItem value="viewer">Viewer</MenuItem>
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="status" control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Status">
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                    </TextField>
                  )} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/users')}
                disabled={isSubmitting} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Cancel</Button>
              <Button type="submit" variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting || loading}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserFormPage;
