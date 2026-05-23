import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, TextField, Button, MenuItem, CircularProgress, Alert,
  Typography, InputAdornment,
} from '@mui/material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAircraftFilling, updateAircraftFilling, fetchAircraftFillingById, clearCurrentItem,
} from '../../store/slices/aircraftFillingSlice';
import { fetchAircrafts } from '../../store/slices/aircraftsSlice';
import { fetchAirports } from '../../store/slices/airportsSlice';
import { fetchFuelStock } from '../../store/slices/fuelStockSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency, formatLiters } from '../../utils/helpers';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const defaultValues = {
  aircraft_id: '', airport_id: '', fuel_quantity: '',
  fuel_rate: '', filling_datetime: new Date().toISOString().slice(0, 16),
  flight_number: '', remarks: '',
};

const AircraftFillingFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, error } = useSelector((s) => s.aircraftFilling);
  const { items: aircrafts } = useSelector((s) => s.aircrafts);
  const { items: airports } = useSelector((s) => s.airports);
  const { stocks } = useSelector((s) => s.fuelStock);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm({ defaultValues });

  const quantity = useWatch({ control, name: 'fuel_quantity' });
  const rate = useWatch({ control, name: 'fuel_rate' });
  const selectedAirportId = useWatch({ control, name: 'airport_id' });
  const totalCost = (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);

  const selectedAirportStock = stocks.find((s) => String(s.airport_id) === String(selectedAirportId));

  useEffect(() => {
    dispatch(fetchAircrafts({ page: 1, page_size: 200 }));
    dispatch(fetchAirports({ page: 1, page_size: 100 }));
    dispatch(fetchFuelStock());
    if (isEdit) dispatch(fetchAircraftFillingById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentItem) {
      reset({
        aircraft_id: currentItem.aircraft_id || '',
        airport_id: currentItem.airport_id || '',
        fuel_quantity: currentItem.fuel_quantity || '',
        fuel_rate: currentItem.fuel_rate || '',
        filling_datetime: currentItem.filling_datetime ? currentItem.filling_datetime.slice(0, 16) : '',
        flight_number: currentItem.flight_number || '',
        remarks: currentItem.remarks || '',
      });
    }
  }, [currentItem, isEdit, reset]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      fuel_quantity: Number(data.fuel_quantity),
      fuel_rate: Number(data.fuel_rate),
      total_cost: totalCost,
    };
    const result = isEdit
      ? await dispatch(updateAircraftFilling({ id, data: payload }))
      : await dispatch(createAircraftFilling(payload));

    if (createAircraftFilling.fulfilled.match(result) || updateAircraftFilling.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: isEdit ? 'Filling updated!' : 'Filling recorded!', severity: 'success' }));
      navigate('/aircraft-filling');
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Operation failed', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Filling Record' : 'New Aircraft Filling'}
        subtitle={isEdit ? 'Update filling record' : 'Record fuel dispensing for an aircraft'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Aircraft Filling', href: '/aircraft-filling' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/aircraft-filling'), color: 'inherit' }}
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {selectedAirportStock && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(21,101,192,0.06)', borderRadius: 2, border: '1px solid', borderColor: 'primary.light' }}>
              <Typography variant="body2" color="text.secondary">
                Available Stock at selected airport:
                <Typography component="span" fontWeight={700} color="primary.main" sx={{ ml: 1 }}>
                  {formatLiters(selectedAirportStock.current_stock)}
                </Typography>
              </Typography>
            </Box>
          )}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Controller name="aircraft_id" control={control} rules={{ required: 'Aircraft is required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Aircraft *"
                      error={!!errors.aircraft_id} helperText={errors.aircraft_id?.message}>
                      {aircrafts.map((a) => (
                        <MenuItem key={a.id} value={a.id}>{a.aircraft_number} — {a.aircraft_model || a.airline_name}</MenuItem>
                      ))}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="airport_id" control={control} rules={{ required: 'Airport is required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Airport *"
                      error={!!errors.airport_id} helperText={errors.airport_id?.message}>
                      {airports.map((a) => <MenuItem key={a.id} value={a.id}>{a.airport_name} ({a.airport_code})</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Fuel Quantity (Liters) *" type="number"
                  {...register('fuel_quantity', { required: 'Quantity required', min: { value: 0.01, message: 'Must be > 0' } })}
                  error={!!errors.fuel_quantity} helperText={errors.fuel_quantity?.message}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">L</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Fuel Rate per Liter *" type="number"
                  {...register('fuel_rate', { required: 'Rate required', min: { value: 0.01, message: 'Must be > 0' } })}
                  error={!!errors.fuel_rate} helperText={errors.fuel_rate?.message}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Filling Date & Time *" type="datetime-local"
                  {...register('filling_datetime', { required: 'Date/time is required' })}
                  error={!!errors.filling_datetime} helperText={errors.filling_datetime?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {totalCost > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(21,101,192,0.06)', borderRadius: 2, border: '1px solid', borderColor: 'primary.light', display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Total Cost:</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">{formatCurrency(totalCost)}</Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Flight Number" {...register('flight_number')} placeholder="e.g. AI-101" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Remarks" {...register('remarks')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/aircraft-filling')}
                disabled={isSubmitting} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Cancel</Button>
              <Button type="submit" variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting || loading}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Record' : 'Record Filling'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AircraftFillingFormPage;
