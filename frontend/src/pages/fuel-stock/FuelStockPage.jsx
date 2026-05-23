import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, LinearProgress, Chip,
  Tab, Tabs, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFuelStock, fetchStockLogs, createStockAdjustment, setLogsPage, setLogsPageSize,
} from '../../store/slices/fuelStockSlice';
import { fetchAirports } from '../../store/slices/airportsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { formatLiters, formatDateTime, getStockLevelColor, getStockPercentage } from '../../utils/helpers';
import TuneIcon from '@mui/icons-material/Tune';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { useForm, Controller } from 'react-hook-form';

const StockCard = ({ stock }) => {
  const pct = getStockPercentage(stock.current_stock, stock.capacity);
  const color = getStockLevelColor(stock.current_stock, stock.capacity);
  const colorMap = { success: '#2E7D32', warning: '#ED6C02', error: '#D32F2F' };

  return (
    <Card sx={{ height: '100%', borderTop: `3px solid ${colorMap[color] || '#1565C0'}` }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(21,101,192,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlightTakeoffIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{stock.airport_name}</Typography>
            <Typography variant="caption" color="text.secondary">{stock.airport_code}</Typography>
          </Box>
          <Chip
            label={pct >= 50 ? 'Normal' : pct >= 20 ? 'Low' : 'Critical'}
            color={color} size="small"
            sx={{ fontWeight: 600, height: 20, fontSize: '0.68rem' }}
          />
        </Box>
        <LinearProgress
          variant="determinate" value={pct} color={color}
          sx={{ mb: 1.5, height: 10, borderRadius: 5 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Current</Typography>
            <Typography variant="body2" fontWeight={700} color={`${color}.main`}>
              {formatLiters(stock.current_stock)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Level</Typography>
            <Typography variant="body2" fontWeight={700}>{pct.toFixed(1)}%</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Capacity</Typography>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {formatLiters(stock.capacity)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const logTypeConfig = {
  purchase: { label: 'Purchase', color: 'success' },
  filling: { label: 'Filling', color: 'primary' },
  adjustment: { label: 'Adjustment', color: 'warning' },
};

const FuelStockPage = () => {
  const dispatch = useDispatch();
  const { stocks, logs, logsTotal, loading, logsLoading, logsPage, logsPageSize } = useSelector((s) => s.fuelStock);
  const { items: airports } = useSelector((s) => s.airports);
  const [tab, setTab] = useState(0);
  const [adjDialog, setAdjDialog] = useState(false);
  const [adjLoading, setAdjLoading] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { airport_id: '', adjustment_type: 'add', quantity: '', notes: '' },
  });

  useEffect(() => {
    dispatch(fetchFuelStock());
    dispatch(fetchAirports({ page: 1, page_size: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (tab === 1) {
      dispatch(fetchStockLogs({ page: logsPage + 1, page_size: logsPageSize }));
    }
  }, [dispatch, tab, logsPage, logsPageSize]);

  const handleAdjSubmit = async (data) => {
    setAdjLoading(true);
    const result = await dispatch(createStockAdjustment({
      airport_id: data.airport_id,
      adjustment_type: data.adjustment_type,
      quantity: Number(data.quantity),
      notes: data.notes,
    }));
    setAdjLoading(false);
    if (createStockAdjustment.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: 'Stock adjustment saved!', severity: 'success' }));
      dispatch(fetchFuelStock());
      setAdjDialog(false);
      reset();
    } else {
      dispatch(showSnackbar({ message: result.payload || 'Adjustment failed', severity: 'error' }));
    }
  };

  const logColumns = [
    { field: 'created_at', label: 'Date/Time', minWidth: 160, render: (v) => formatDateTime(v) },
    { field: 'airport_name', label: 'Airport', minWidth: 130 },
    {
      field: 'log_type',
      label: 'Type', minWidth: 120,
      render: (v) => {
        const cfg = logTypeConfig[v] || { label: v, color: 'default' };
        return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }} />;
      },
    },
    {
      field: 'quantity_change',
      label: 'Quantity', minWidth: 120, align: 'right',
      render: (v) => (
        <Typography variant="body2" fontWeight={600} color={v >= 0 ? 'success.main' : 'error.main'}>
          {v >= 0 ? '+' : ''}{formatLiters(v)}
        </Typography>
      ),
    },
    { field: 'notes', label: 'Notes', minWidth: 200, render: (v) => v || '-' },
  ];

  return (
    <Box>
      <PageHeader
        title="Fuel Stock"
        subtitle="Monitor and manage fuel inventory"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Fuel Stock' }]}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Current Stock" />
        <Tab label="Stock Logs" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2.5}>
          {loading
            ? [0,1,2,3].map((i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Card sx={{ p: 2.5 }}>
                    {[0,1,2].map((j) => <Box key={j} sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1, mb: 1 }} />)}
                  </Card>
                </Grid>
              ))
            : stocks.length === 0
            ? (
                <Grid item xs={12}>
                  <Card sx={{ p: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">No stock data available</Typography>
                  </Card>
                </Grid>
              )
            : stocks.map((stock) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={stock.airport_id}>
                  <StockCard stock={stock} />
                </Grid>
              ))}
        </Grid>
      )}

      {tab === 1 && (
        <DataTable
          columns={logColumns}
          rows={logs}
          loading={logsLoading}
          total={logsTotal}
          page={logsPage}
          pageSize={logsPageSize}
          onPageChange={(p) => dispatch(setLogsPage(p))}
          onPageSizeChange={(ps) => { dispatch(setLogsPageSize(ps)); dispatch(setLogsPage(0)); }}
          searchPlaceholder="Search logs..."
        />
      )}

      {/* FAB for Adjustment */}
      <Fab
        color="primary" variant="extended" size="medium"
        sx={{ position: 'fixed', bottom: 32, right: 32, px: 3 }}
        onClick={() => setAdjDialog(true)}
      >
        <TuneIcon sx={{ mr: 1 }} />
        Adjustment
      </Fab>

      {/* Adjustment Dialog */}
      <Dialog open={adjDialog} onClose={() => setAdjDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle fontWeight={700}>Manual Stock Adjustment</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Controller name="airport_id" control={control} rules={{ required: 'Select an airport' }}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Airport *"
                  error={!!errors.airport_id} helperText={errors.airport_id?.message}>
                  {airports.map((a) => <MenuItem key={a.id} value={a.id}>{a.airport_name} ({a.airport_code})</MenuItem>)}
                </TextField>
              )} />
            <Controller name="adjustment_type" control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Type">
                  <MenuItem value="add">Add Stock (+)</MenuItem>
                  <MenuItem value="remove">Remove Stock (-)</MenuItem>
                </TextField>
              )} />
            <TextField
              fullWidth label="Quantity (Liters) *" type="number"
              {...register('quantity', { required: 'Quantity required', min: { value: 0.01, message: 'Must be positive' } })}
              error={!!errors.quantity} helperText={errors.quantity?.message}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField fullWidth multiline rows={2} label="Notes" {...register('notes')} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setAdjDialog(false)}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit(handleAdjSubmit)} disabled={adjLoading}
            startIcon={adjLoading ? <CircularProgress size={16} color="inherit" /> : null}>
            {adjLoading ? 'Saving...' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FuelStockPage;
