import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, TextField, Button, MenuItem,
  CircularProgress, Alert, Typography, Divider, InputAdornment,
} from '@mui/material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createFuelPurchase, updateFuelPurchase, fetchFuelPurchaseById, clearCurrentItem,
} from '../../store/slices/fuelPurchasesSlice';
import { fetchAirports } from '../../store/slices/airportsSlice';
import { fetchFuelAgents } from '../../store/slices/fuelAgentsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import PageHeader from '../../components/common/PageHeader';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { formatCurrency } from '../../utils/helpers';

const defaultValues = {
  agent_id: '', airport_id: '', fuel_type: 'ATF',
  quantity_purchased: '', purchase_rate: '',
  purchase_date: new Date().toISOString().split('T')[0],
  invoice_number: '', payment_status: 'pending', remarks: '',
};

const FuelPurchaseFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, error } = useSelector((s) => s.fuelPurchases);
  const { items: airports } = useSelector((s) => s.airports);
  const { items: agents } = useSelector((s) => s.fuelAgents);
  const [invoiceFile, setInvoiceFile] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm({ defaultValues });

  const quantity = useWatch({ control, name: 'quantity_purchased' });
  const rate = useWatch({ control, name: 'purchase_rate' });
  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);

  useEffect(() => {
    dispatch(fetchAirports({ page: 1, page_size: 100 }));
    dispatch(fetchFuelAgents({ page: 1, page_size: 100 }));
    if (isEdit) dispatch(fetchFuelPurchaseById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentItem) {
      reset({
        agent_id: currentItem.agent_id || '',
        airport_id: currentItem.airport_id || '',
        fuel_type: currentItem.fuel_type || 'ATF',
        quantity_purchased: currentItem.quantity_purchased || '',
        purchase_rate: currentItem.purchase_rate || '',
        purchase_date: currentItem.purchase_date ? currentItem.purchase_date.split('T')[0] : '',
        invoice_number: currentItem.invoice_number || '',
        payment_status: currentItem.payment_status || 'pending',
        remarks: currentItem.remarks || '',
      });
    }
  }, [currentItem, isEdit, reset]);

  const onSubmit = async (data) => {
    const payload = { ...data, total_amount: totalAmount, quantity_purchased: Number(data.quantity_purchased), purchase_rate: Number(data.purchase_rate) };
    const result = isEdit
      ? await dispatch(updateFuelPurchase({ id, data: payload }))
      : await dispatch(createFuelPurchase(payload));

    if (createFuelPurchase.fulfilled.match(result) || updateFuelPurchase.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: isEdit ? 'Purchase updated!' : 'Purchase created!', severity: 'success' }));
      navigate('/fuel-purchases');
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Operation failed', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Purchase' : 'Add Fuel Purchase'}
        subtitle={isEdit ? 'Update purchase record' : 'Record a new fuel purchase'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fuel Purchases', href: '/fuel-purchases' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        action={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/fuel-purchases'), color: 'inherit' }}
      />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Controller name="agent_id" control={control} rules={{ required: 'Fuel agent is required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Fuel Agent *"
                      error={!!errors.agent_id} helperText={errors.agent_id?.message}>
                      {agents.map((a) => <MenuItem key={a.id} value={a.id}>{a.name} — {a.company_name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="airport_id" control={control} rules={{ required: 'Airport is required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Airport *"
                      error={!!errors.airport_id} helperText={errors.airport_id?.message}>
                      {airports.map((a) => <MenuItem key={a.id} value={a.id}>{a.name} ({a.code})</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="fuel_type" control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Fuel Type">
                      <MenuItem value="ATF">ATF (Aviation Turbine Fuel)</MenuItem>
                      <MenuItem value="AVGAS">AVGAS (Aviation Gasoline)</MenuItem>
                      <MenuItem value="JET-A1">JET-A1</MenuItem>
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Quantity Purchased (Liters) *"
                  type="number"
                  {...register('quantity_purchased', { required: 'Quantity is required', min: { value: 0.01, message: 'Must be greater than 0' } })}
                  error={!!errors.quantity_purchased} helperText={errors.quantity_purchased?.message}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">L</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Purchase Rate per Liter *"
                  type="number"
                  {...register('purchase_rate', { required: 'Rate is required', min: { value: 0.01, message: 'Must be greater than 0' } })}
                  error={!!errors.purchase_rate} helperText={errors.purchase_rate?.message}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>

              {/* Total Amount Display */}
              {totalAmount > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(21, 101, 192, 0.06)', borderRadius: 2, border: '1px solid', borderColor: 'primary.light', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">{formatCurrency(totalAmount)}</Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Purchase Date *" type="date"
                  {...register('purchase_date', { required: 'Date is required' })}
                  error={!!errors.purchase_date} helperText={errors.purchase_date?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Invoice Number"
                  {...register('invoice_number')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="payment_status" control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Payment Status">
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="partial">Partial</MenuItem>
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Remarks" {...register('remarks')} />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined" component="label"
                  startIcon={<AttachFileIcon />}
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}
                >
                  {invoiceFile ? invoiceFile.name : 'Attach Invoice (PDF/Image)'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden
                    onChange={(e) => setInvoiceFile(e.target.files[0])} />
                </Button>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={() => navigate('/fuel-purchases')}
                disabled={isSubmitting} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={isSubmitting || loading}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Purchase' : 'Create Purchase'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FuelPurchaseFormPage;
