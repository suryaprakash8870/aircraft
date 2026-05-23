import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fuelPurchasesApi } from '../../api/fuelPurchasesApi';

export const fetchFuelPurchases = createAsyncThunk(
  'fuelPurchases/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fuelPurchasesApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch purchases');
    }
  }
);

export const fetchFuelPurchaseById = createAsyncThunk(
  'fuelPurchases/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fuelPurchasesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch purchase');
    }
  }
);

export const createFuelPurchase = createAsyncThunk(
  'fuelPurchases/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await fuelPurchasesApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create purchase');
    }
  }
);

export const updateFuelPurchase = createAsyncThunk(
  'fuelPurchases/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await fuelPurchasesApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update purchase');
    }
  }
);

export const deleteFuelPurchase = createAsyncThunk(
  'fuelPurchases/delete',
  async (id, { rejectWithValue }) => {
    try {
      await fuelPurchasesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete purchase');
    }
  }
);

const fuelPurchasesSlice = createSlice({
  name: 'fuelPurchases',
  initialState: {
    items: [],
    total: 0,
    currentItem: null,
    loading: false,
    error: null,
    currentPage: 0,
    pageSize: 10,
    filters: {
      search: '',
      dateFrom: null,
      dateTo: null,
      airport: '',
      agent: '',
      paymentStatus: '',
    },
  },
  reducers: {
    setPage: (state, action) => { state.currentPage = action.payload; },
    setPageSize: (state, action) => { state.pageSize = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearFilters: (state) => {
      state.filters = { search: '', dateFrom: null, dateTo: null, airport: '', agent: '', paymentStatus: '' };
    },
    clearCurrentItem: (state) => { state.currentItem = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelPurchases.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFuelPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchFuelPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFuelPurchaseById.pending, (state) => { state.loading = true; })
      .addCase(fetchFuelPurchaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchFuelPurchaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFuelPurchase.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateFuelPurchase.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentItem?.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(deleteFuelPurchase.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { setPage, setPageSize, setFilters, clearFilters, clearCurrentItem, clearError } =
  fuelPurchasesSlice.actions;
export default fuelPurchasesSlice.reducer;
