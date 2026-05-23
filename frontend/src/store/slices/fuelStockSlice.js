import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fuelStockApi } from '../../api/fuelStockApi';

export const fetchFuelStock = createAsyncThunk(
  'fuelStock/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fuelStockApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fuel stock');
    }
  }
);

export const fetchStockLogs = createAsyncThunk(
  'fuelStock/fetchLogs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fuelStockApi.getLogs(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock logs');
    }
  }
);

export const createStockAdjustment = createAsyncThunk(
  'fuelStock/adjustment',
  async (data, { rejectWithValue }) => {
    try {
      const response = await fuelStockApi.adjustment(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create adjustment');
    }
  }
);

const fuelStockSlice = createSlice({
  name: 'fuelStock',
  initialState: {
    stocks: [],
    logs: [],
    logsTotal: 0,
    loading: false,
    logsLoading: false,
    error: null,
    logsPage: 0,
    logsPageSize: 10,
  },
  reducers: {
    setLogsPage: (state, action) => { state.logsPage = action.payload; },
    setLogsPageSize: (state, action) => { state.logsPageSize = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelStock.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFuelStock.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.items || action.payload;
      })
      .addCase(fetchFuelStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStockLogs.pending, (state) => { state.logsLoading = true; })
      .addCase(fetchStockLogs.fulfilled, (state, action) => {
        state.logsLoading = false;
        state.logs = action.payload.items || action.payload;
        state.logsTotal = action.payload.total || action.payload.length;
      })
      .addCase(fetchStockLogs.rejected, (state, action) => {
        state.logsLoading = false;
        state.error = action.payload;
      })
      .addCase(createStockAdjustment.fulfilled, (state, action) => {
        // Refresh logs and stocks after adjustment
        const updatedStock = action.payload.stock;
        if (updatedStock) {
          const idx = state.stocks.findIndex((s) => s.airport_id === updatedStock.airport_id);
          if (idx !== -1) state.stocks[idx] = updatedStock;
        }
      });
  },
});

export const { setLogsPage, setLogsPageSize, clearError } = fuelStockSlice.actions;
export default fuelStockSlice.reducer;
