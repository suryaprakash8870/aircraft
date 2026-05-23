import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aircraftFillingApi } from '../../api/aircraftFillingApi';

export const fetchAircraftFillings = createAsyncThunk(
  'aircraftFilling/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await aircraftFillingApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fillings');
    }
  }
);

export const fetchAircraftFillingById = createAsyncThunk(
  'aircraftFilling/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aircraftFillingApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch filling');
    }
  }
);

export const createAircraftFilling = createAsyncThunk(
  'aircraftFilling/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await aircraftFillingApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create filling');
    }
  }
);

export const updateAircraftFilling = createAsyncThunk(
  'aircraftFilling/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await aircraftFillingApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update filling');
    }
  }
);

export const deleteAircraftFilling = createAsyncThunk(
  'aircraftFilling/delete',
  async (id, { rejectWithValue }) => {
    try {
      await aircraftFillingApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete filling');
    }
  }
);

const aircraftFillingSlice = createSlice({
  name: 'aircraftFilling',
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
      aircraft: '',
    },
  },
  reducers: {
    setPage: (state, action) => { state.currentPage = action.payload; },
    setPageSize: (state, action) => { state.pageSize = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearFilters: (state) => {
      state.filters = { search: '', dateFrom: null, dateTo: null, airport: '', aircraft: '' };
    },
    clearCurrentItem: (state) => { state.currentItem = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAircraftFillings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAircraftFillings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchAircraftFillings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAircraftFillingById.pending, (state) => { state.loading = true; })
      .addCase(fetchAircraftFillingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchAircraftFillingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAircraftFilling.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAircraftFilling.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentItem?.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(deleteAircraftFilling.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { setPage, setPageSize, setFilters, clearFilters, clearCurrentItem, clearError } =
  aircraftFillingSlice.actions;
export default aircraftFillingSlice.reducer;
