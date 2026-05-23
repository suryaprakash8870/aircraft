import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createFuelAgent,
  updateFuelAgent,
  fetchFuelAgentById,
  clearCurrentItem,
} from '../../store/slices/fuelAgentsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import PageHeader from '../../components/common/PageHeader';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const defaultValues = {
  agent_name: '',
  company_name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  gst_number: '',
  status: 'active',
};

const FuelAgentFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, error } = useSelector((state) => state.fuelAgents);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchFuelAgentById(id));
    }
    return () => dispatch(clearCurrentItem());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentItem) {
      reset({
        agent_name: currentItem.agent_name || '',
        company_name: currentItem.company_name || '',
        contact_person: currentItem.contact_person || '',
        phone: currentItem.phone || '',
        email: currentItem.email || '',
        address: currentItem.address || '',
        gst_number: currentItem.gst_number || '',
        status: currentItem.status || 'active',
      });
    }
  }, [currentItem, isEdit, reset]);

  const onSubmit = async (data) => {
    const result = isEdit
      ? await dispatch(updateFuelAgent({ id, data }))
      : await dispatch(createFuelAgent(data));

    if (createFuelAgent.fulfilled.match(result) || updateFuelAgent.fulfilled.match(result)) {
      dispatch(showSnackbar({
        message: isEdit ? 'Fuel agent updated successfully!' : 'Fuel agent created successfully!',
        severity: 'success',
      }));
      navigate('/fuel-agents');
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Operation failed', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Fuel Agent' : 'Add Fuel Agent'}
        subtitle={isEdit ? 'Update fuel agent information' : 'Register a new fuel supplier agent'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fuel Agents', href: '/fuel-agents' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={{
          label: 'Back to List',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/fuel-agents'),
          color: 'inherit',
        }}
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Agent Name *"
                  {...register('agent_name', { required: 'Agent name is required' })}
                  error={!!errors.agent_name}
                  helperText={errors.agent_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  {...register('company_name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  {...register('contact_person')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  {...register('phone', {
                    pattern: {
                      value: /^[+\d][\d\s\-()]{8,14}$/,
                      message: 'Enter a valid phone number',
                    },
                  })}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  {...register('email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  {...register('gst_number', {
                    pattern: {
                      value: /^[0-9A-Z]{15}$/,
                      message: 'GST number must be 15 alphanumeric characters',
                    },
                  })}
                  error={!!errors.gst_number}
                  helperText={errors.gst_number?.message}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Address"
                  {...register('address')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/fuel-agents')}
                disabled={isSubmitting}
                sx={{ borderColor: 'divider', color: 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Agent' : 'Create Agent'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FuelAgentFormPage;
