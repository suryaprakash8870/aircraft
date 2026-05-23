import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../api/dashboardApi';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getStats();
      return response.data;
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
        monthlyPurchase: purchase.data,
        monthlyConsumption: consumption.data,
        vendorAnalytics: vendor.data,
        airportUsage: airportUsage.data,
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
      return response.data;
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
