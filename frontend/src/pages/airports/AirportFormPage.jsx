import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, TextField, Button, CircularProgress, Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAirport, updateAirport, fetchAirportById, clearCurrentItem,
} from '../../store/slices/airportsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import PageHeader from '../../components/common/PageHeader';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const defaultValues = {
  airport_name: '', airport_code: '', city: '', country: 'India', fuel_storage_capacity: '',
};

const AirportFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, error } = useSelector((state) => state.airports);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm({ defaultValues });

  useEffect(() => {
    if (isEdit) dispatch(fetchAirportById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentItem) {
      reset({
        airport_name: currentItem.airport_name || '',
        airport_code: currentItem.airport_code || '',
        city: currentItem.city || '',
        country: currentItem.country || 'India',
        fuel_storage_capacity: currentItem.fuel_storage_capacity || '',
      });
    }
  }, [currentItem, isEdit, reset]);

  const onSubmit = async (data) => {
    const payload = { ...data, airport_code: data.airport_code.toUpperCase(), fuel_storage_capacity: Number(data.fuel_storage_capacity) };
    const result = isEdit
      ? await dispatch(updateAirport({ id, data: payload }))
      : await dispatch(createAirport(payload));

    if (createAirport.fulfilled.match(result) || updateAirport.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: isEdit ? 'Airport updated!' : 'Airport created!', severity: 'success' }));
      navigate('/airports');
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Operation failed', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Airport' : 'Add Airport'}
        subtitle={isEdit ? 'Update airport details' : 'Register a new airport location'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Airports', href: '/airports' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/airports'), color: 'inherit' }}
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth label="Airport Name *"
                  {...register('airport_name', { required: 'Airport name is required' })}
                  error={!!errors.airport_name} helperText={errors.airport_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="IATA Code *"
                  {...register('airport_code', {
                    required: 'Airport code is required',
                    pattern: { value: /^[A-Za-z]{3}$/, message: 'Must be 3 letters (e.g. DEL)' },
                  })}
                  error={!!errors.airport_code} helperText={errors.airport_code?.message}
                  inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                  onChange={(e) => setValue('airport_code', e.target.value.toUpperCase())}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="City" {...register('city')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Country" {...register('country')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Fuel Storage Capacity (Liters)"
                  type="number"
                  {...register('fuel_storage_capacity', {
                    min: { value: 0, message: 'Must be a positive number' },
                  })}
                  error={!!errors.fuel_storage_capacity}
                  helperText={errors.fuel_storage_capacity?.message || 'Maximum fuel storage capacity in liters'}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/airports')}
                disabled={isSubmitting} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting || loading}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Airport' : 'Create Airport'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AirportFormPage;
