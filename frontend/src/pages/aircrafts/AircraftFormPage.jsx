import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, TextField, Button, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAircraft, updateAircraft, fetchAircraftById, clearCurrentItem,
} from '../../store/slices/aircraftsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import PageHeader from '../../components/common/PageHeader';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const defaultValues = {
  aircraft_number: '', model: '', airline_name: '', fuel_capacity: '', status: 'operational',
};

const AircraftFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, error } = useSelector((s) => s.aircrafts);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm({ defaultValues });

  useEffect(() => {
    if (isEdit) dispatch(fetchAircraftById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentItem) {
      reset({
        aircraft_number: currentItem.aircraft_number || '',
        model: currentItem.model || '',
        airline_name: currentItem.airline_name || '',
        fuel_capacity: currentItem.fuel_capacity || '',
        status: currentItem.status || 'operational',
      });
    }
  }, [currentItem, isEdit, reset]);

  const onSubmit = async (data) => {
    const payload = { ...data, fuel_capacity: Number(data.fuel_capacity) };
    const result = isEdit
      ? await dispatch(updateAircraft({ id, data: payload }))
      : await dispatch(createAircraft(payload));

    if (createAircraft.fulfilled.match(result) || updateAircraft.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: isEdit ? 'Aircraft updated!' : 'Aircraft created!', severity: 'success' }));
      navigate('/aircrafts');
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Operation failed', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Aircraft' : 'Add Aircraft'}
        subtitle={isEdit ? 'Update aircraft details' : 'Register a new aircraft'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Aircrafts', href: '/aircrafts' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/aircrafts'), color: 'inherit' }}
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Aircraft Number / Registration *"
                  {...register('aircraft_number', { required: 'Aircraft number is required' })}
                  error={!!errors.aircraft_number} helperText={errors.aircraft_number?.message}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Aircraft Model" {...register('model')} placeholder="e.g. Boeing 737, Airbus A320" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Airline Name" {...register('airline_name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Fuel Capacity (Liters)"
                  type="number"
                  {...register('fuel_capacity', { min: { value: 0, message: 'Must be positive' } })}
                  error={!!errors.fuel_capacity} helperText={errors.fuel_capacity?.message}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="status" control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Status">
                      <MenuItem value="operational">Operational</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="grounded">Grounded</MenuItem>
                    </TextField>
                  )} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/aircrafts')}
                disabled={isSubmitting} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Cancel</Button>
              <Button type="submit" variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting || loading}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Aircraft' : 'Create Aircraft'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AircraftFormPage;
