import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Tab, Tabs, TextField, MenuItem,
  Button, Chip, Skeleton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice';
import { fetchAirports } from '../../store/slices/airportsSlice';
import { fetchFuelAgents } from '../../store/slices/fuelAgentsSlice';
import { fetchAircrafts } from '../../store/slices/aircraftsSlice';
import { reportsApi } from '../../api/reportsApi';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, formatLiters, formatDate, downloadBlob } from '../../utils/helpers';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import InventoryIcon from '@mui/icons-material/Inventory';

const tabLabels = [
  'Fuel Purchases',
  'Fuel Consumption',
  'Airport Stock',
  'Aircraft History',
  'Vendor Report',
];

const FilterBar = ({ filters, setFilters, airports, agents, aircrafts, showAirport, showAgent, showAircraft }) => (
  <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
    <Grid item xs={12} sm={6} md={3}>
      <TextField
        fullWidth size="small" label="From Date" type="date" value={filters.dateFrom}
        onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <TextField
        fullWidth size="small" label="To Date" type="date" value={filters.dateTo}
        onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    {showAirport && (
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select fullWidth size="small" label="Airport" value={filters.airport}
          onChange={(e) => setFilters((p) => ({ ...p, airport: e.target.value }))}
        >
          <MenuItem value="">All Airports</MenuItem>
          {airports.map((a) => <MenuItem key={a.id} value={a.id}>{a.airport_name} ({a.airport_code})</MenuItem>)}
        </TextField>
      </Grid>
    )}
    {showAgent && (
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select fullWidth size="small" label="Fuel Agent" value={filters.agent}
          onChange={(e) => setFilters((p) => ({ ...p, agent: e.target.value }))}
        >
          <MenuItem value="">All Agents</MenuItem>
          {agents.map((a) => <MenuItem key={a.id} value={a.id}>{a.agent_name}</MenuItem>)}
        </TextField>
      </Grid>
    )}
    {showAircraft && (
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select fullWidth size="small" label="Aircraft" value={filters.aircraft}
          onChange={(e) => setFilters((p) => ({ ...p, aircraft: e.target.value }))}
        >
          <MenuItem value="">All Aircraft</MenuItem>
          {aircrafts.map((a) => <MenuItem key={a.id} value={a.id}>{a.aircraft_number}</MenuItem>)}
        </TextField>
      </Grid>
    )}
  </Grid>
);

const ExportButtons = ({ onExportPdf, onExportCsv, onExportXlsx, loading }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
    <Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={onExportPdf} disabled={loading} color="secondary">
      Export PDF
    </Button>
    <Button variant="outlined" size="small" startIcon={<TableChartIcon />} onClick={onExportXlsx} disabled={loading} color="primary">
      Export Excel
    </Button>
    <Button variant="outlined" size="small" startIcon={<TableChartIcon />} onClick={onExportCsv} disabled={loading} color="success">
      Export CSV
    </Button>
  </Box>
);

const defaultFilters = { dateFrom: '', dateTo: '', airport: '', agent: '', aircraft: '' };

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { items: airports } = useSelector((s) => s.airports);
  const { items: agents } = useSelector((s) => s.fuelAgents);
  const { items: aircrafts } = useSelector((s) => s.aircrafts);

  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchAirports({ page: 1, page_size: 100 }));
    dispatch(fetchFuelAgents({ page: 1, page_size: 100 }));
    dispatch(fetchAircrafts({ page: 1, page_size: 200 }));
  }, [dispatch]);

  useEffect(() => {
    setPage(0);
  }, [tab, filters]);

  useEffect(() => {
    loadReport();
  }, [tab, page, pageSize, filters]);

  const getParams = () => ({
    start_date: filters.dateFrom || undefined,
    end_date: filters.dateTo || undefined,
    airport_id: filters.airport || undefined,
    agent_id: filters.agent || undefined,
    aircraft_id: filters.aircraft || undefined,
  });

  // Extract the row array from each endpoint's specific response shape.
  // Backend shapes:
  //   /fuel-purchases   -> { data: [...], total: N }
  //   /fuel-consumption -> { data: [...], total: N }
  //   /airport-stock    -> { data: [...], total: N }
  //   /aircraft-history -> { aircraft, summary, fillings: [...] }
  //   /vendor           -> { agent, summary, purchases: [...] }
  const extractRows = (tabIdx, body) => {
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (tabIdx === 3 && Array.isArray(body.fillings)) return body.fillings;
    if (tabIdx === 4 && Array.isArray(body.purchases)) return body.purchases;
    if (Array.isArray(body.items)) return body.items;
    return [];
  };

  const loadReport = async () => {
    // Tab 3 (Aircraft History) requires aircraft_id; Tab 4 (Vendor) requires agent_id
    if (tab === 3 && !filters.aircraft) {
      setData([]); setTotal(0); setSummary(null); return;
    }
    if (tab === 4 && !filters.agent) {
      setData([]); setTotal(0); setSummary(null); return;
    }

    setLoading(true);
    try {
      const params = getParams();
      let response;
      if (tab === 0) response = await reportsApi.getFuelPurchases(params);
      else if (tab === 1) response = await reportsApi.getFuelConsumption(params);
      else if (tab === 2) response = await reportsApi.getAirportStock(params);
      else if (tab === 3) response = await reportsApi.getAircraftHistory(params);
      else response = await reportsApi.getVendorReport(params);

      const rows = extractRows(tab, response.data);
      setData(rows);
      setTotal(response.data?.total ?? rows.length);
      setSummary(response.data?.summary || null);
    } catch (err) {
      setData([]); setTotal(0); setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Map tab index to the backend `type` parameter value
  const TAB_TO_TYPE = ['purchases', 'consumption', 'airport_stock', 'aircraft_history', 'vendor'];

  const handleExport = async (format) => {
    // Tabs 3 (aircraft_history) and 4 (vendor) require an entity filter
    if (tab === 3 && !filters.aircraft) {
      dispatch(showSnackbar({ message: 'Select an aircraft first', severity: 'warning' }));
      return;
    }
    if (tab === 4 && !filters.agent) {
      dispatch(showSnackbar({ message: 'Select an agent first', severity: 'warning' }));
      return;
    }

    setExportLoading(true);
    try {
      const params = {
        ...getParams(),
        type: TAB_TO_TYPE[tab],
        format,
      };
      const response = await reportsApi.exportReport(params);
      const slug = tabLabels[tab].toLowerCase().replace(/ /g, '-');
      const ext = format === 'xlsx' ? 'xlsx' : format;
      downloadBlob(response.data, `report-${slug}.${ext}`);
      dispatch(showSnackbar({ message: `Exported ${format.toUpperCase()} successfully`, severity: 'success' }));
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Export failed';
      dispatch(showSnackbar({ message: typeof detail === 'string' ? detail : 'Export failed', severity: 'error' }));
    } finally {
      setExportLoading(false);
    }
  };

  // Column definitions per tab
  const columnSets = [
    // 0 - Fuel Purchases
    [
      { field: 'purchase_date', label: 'Date', render: (v) => formatDate(v) },
      { field: 'agent_name', label: 'Agent' },
      { field: 'airport_name', label: 'Airport' },
      { field: 'fuel_type', label: 'Type' },
      { field: 'quantity_purchased', label: 'Quantity', align: 'right', render: (v) => formatLiters(v) },
      { field: 'purchase_rate', label: 'Rate/L', align: 'right', render: (v) => formatCurrency(v) },
      { field: 'total_amount', label: 'Total', align: 'right', render: (v) => formatCurrency(v) },
      { field: 'payment_status', label: 'Status', render: (v) => <Chip label={v} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }} /> },
    ],
    // 1 - Fuel Consumption
    [
      { field: 'filling_datetime', label: 'Date', render: (v) => formatDate(v) },
      { field: 'aircraft_number', label: 'Aircraft' },
      { field: 'airline_name', label: 'Airline' },
      { field: 'airport_code', label: 'Airport' },
      { field: 'flight_number', label: 'Flight No.' },
      { field: 'quantity_filled', label: 'Quantity', align: 'right', render: (v) => formatLiters(v) },
      { field: 'fuel_rate', label: 'Rate/L', align: 'right', render: (v) => formatCurrency(v) },
      { field: 'total_cost', label: 'Total Cost', align: 'right', render: (v) => formatCurrency(v) },
    ],
    // 2 - Airport Stock
    [
      { field: 'airport_name', label: 'Airport' },
      { field: 'airport_code', label: 'Code' },
      { field: 'fuel_type', label: 'Fuel Type' },
      { field: 'current_stock', label: 'Current Stock', align: 'right', render: (v) => formatLiters(v) },
      { field: 'fuel_storage_capacity', label: 'Capacity', align: 'right', render: (v) => formatLiters(v) },
      { field: 'last_updated', label: 'Last Updated', render: (v) => formatDate(v) },
    ],
    // 3 - Aircraft History (fillings per selected aircraft)
    [
      { field: 'filling_datetime', label: 'Date', render: (v) => formatDate(v) },
      { field: 'airport_code', label: 'Airport' },
      { field: 'flight_number', label: 'Flight No.' },
      { field: 'quantity_filled', label: 'Fuel Qty', align: 'right', render: (v) => formatLiters(v) },
      { field: 'fuel_rate', label: 'Rate/L', align: 'right', render: (v) => formatCurrency(v) },
      { field: 'total_cost', label: 'Cost', align: 'right', render: (v) => formatCurrency(v) },
    ],
    // 4 - Vendor Report (purchases for selected agent)
    [
      { field: 'purchase_date', label: 'Date', render: (v) => formatDate(v) },
      { field: 'purchase_id', label: 'Purchase ID' },
      { field: 'airport_code', label: 'Airport' },
      { field: 'fuel_type', label: 'Fuel Type' },
      { field: 'quantity_purchased', label: 'Quantity', align: 'right', render: (v) => formatLiters(v) },
      { field: 'purchase_rate', label: 'Rate/L', align: 'right', render: (v) => formatCurrency(v) },
      { field: 'total_amount', label: 'Total Amount', align: 'right', render: (v) => formatCurrency(v) },
      { field: 'payment_status', label: 'Status', render: (v) => <Chip label={v} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }} /> },
    ],
  ];

  // Summary card mapping per tab. Aircraft-history returns total_quantity_filled + total_cost;
  // vendor returns total_quantity + total_amount + total_purchases.
  const summaryCards = (() => {
    if (!summary) return [];
    if (tab === 3) {
      // Aircraft History
      return [
        { title: 'Total Fillings', value: (summary.total_fillings ?? 0).toLocaleString(), icon: AssessmentIcon, color: 'info' },
        { title: 'Total Quantity', value: formatLiters(summary.total_quantity_filled ?? 0), icon: LocalGasStationIcon, color: 'primary' },
        { title: 'Total Cost', value: formatCurrency(summary.total_cost ?? 0), icon: ShoppingCartIcon, color: 'success' },
      ];
    }
    if (tab === 4) {
      // Vendor Report
      return [
        { title: 'Total Purchases', value: (summary.total_purchases ?? 0).toLocaleString(), icon: AssessmentIcon, color: 'info' },
        { title: 'Total Quantity', value: formatLiters(summary.total_quantity ?? 0), icon: LocalGasStationIcon, color: 'primary' },
        { title: 'Total Amount', value: formatCurrency(summary.total_amount ?? 0), icon: ShoppingCartIcon, color: 'success' },
      ];
    }
    return [];
  })();

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Analytics and reporting for fuel operations"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
      />

      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        variant="scrollable" scrollButtons="auto"
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {tabLabels.map((label) => (
          <Tab key={label} label={label} sx={{ fontSize: '0.8125rem' }} />
        ))}
      </Tabs>

      <FilterBar
        filters={filters} setFilters={setFilters}
        airports={airports} agents={agents} aircrafts={aircrafts}
        showAirport={[0, 1, 2].includes(tab)}
        showAgent={tab === 0 || tab === 4}
        showAircraft={tab === 3}
      />

      {summaryCards.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {summaryCards.map((card, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <StatCard {...card} loading={loading} />
            </Grid>
          ))}
        </Grid>
      )}

      <ExportButtons
        onExportPdf={() => handleExport('pdf')}
        onExportXlsx={() => handleExport('xlsx')}
        onExportCsv={() => handleExport('csv')}
        loading={exportLoading}
      />

      <DataTable
        columns={columnSets[tab]}
        rows={data}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(0); }}
        searchPlaceholder="Search..."
      />
    </Box>
  );
};

export default ReportsPage;
