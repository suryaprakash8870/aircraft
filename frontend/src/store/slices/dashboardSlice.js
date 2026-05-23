import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../api/dashboardApi';

// Backend returns snake_case stats keys + chart arrays of objects.
// Transform here so DashboardPage keeps reading the camelCase fields
// it already expects (totalFuelStock, airportStocks, charts.xxx.{labels,values}).

const mapStats = (raw = {}) => ({
  totalFuelStock: raw.total_stock ?? 0,
  purchasedThisMonth: raw.monthly_purchased ?? 0,
  consumedThisMonth: raw.monthly_consumed ?? 0,
  totalFueled: raw.total_aircraft_fueled ?? 0,
  airportStocks: raw.airport_stock_summary ?? [],
});

const toLabelsValues = (arr, labelKey, valueKey) => ({
  labels: (arr || []).map((r) => r[labelKey]),
  values: (arr || []).map((r) => Number(r[valueKey] ?? 0)),
});

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getStats();
      return mapStats(response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchDashboardCharts = createAsyncThunk(
  'dashboard/fetchCharts',
  async (_, { rejectWithValue }) => {
    try {
      const [purchase, consumption, vendor, airportUsage] = await Promise.all([
        dashboardApi.getMonthlyPurchase(),
        dashboardApi.getMonthlyConsumption(),
        dashboardApi.getVendorAnalytics(),
        dashboardApi.getAirportUsage(),
      ]);
      return {
        // Each is [{month, quantity[, amount]}, ...] → {labels:[months], values:[quantities]}
        monthlyPurchase: toLabelsValues(purchase.data, 'month', 'quantity'),
        monthlyConsumption: toLabelsValues(consumption.data, 'month', 'quantity'),
        // [{agent_name, total_quantity, total_amount}, ...] → use total_amount for share
        vendorAnalytics: toLabelsValues(vendor.data, 'agent_name', 'total_amount'),
        // [{airport_code, stock, consumed}, ...] → show consumed by airport
        airportUsage: toLabelsValues(airportUsage.data, 'airport_code', 'consumed'),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chart data');
    }
  }
);

export const fetchRecentTransactions = createAsyncThunk(
  'dashboard/fetchRecentTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getRecentTransactions();
      // Map reference_id -> reference, keep description as airport-column fallback
      return (response.data || []).map((tx) => ({
        ...tx,
        reference: tx.reference_id,
        airport: tx.airport || tx.description || '-',
      }));
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: {
      totalFuelStock: 0,
      purchasedThisMonth: 0,
      consumedThisMonth: 0,
      totalFueled: 0,
      airportStocks: [],
    },
    charts: {
      monthlyPurchase: null,
      monthlyConsumption: null,
      vendorAnalytics: null,
      airportUsage: null,
    },
    recentTransactions: [],
    loading: false,
    chartsLoading: false,
    transactionsLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDashboardCharts.pending, (state) => { state.chartsLoading = true; })
      .addCase(fetchDashboardCharts.fulfilled, (state, action) => {
        state.chartsLoading = false;
        state.charts = action.payload;
      })
      .addCase(fetchDashboardCharts.rejected, (state, action) => {
        state.chartsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchRecentTransactions.pending, (state) => { state.transactionsLoading = true; })
      .addCase(fetchRecentTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.recentTransactions = action.payload;
      })
      .addCase(fetchRecentTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
