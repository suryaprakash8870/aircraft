import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { airportsApi } from '../../api/airportsApi';

export const fetchAirports = createAsyncThunk(
  'airports/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await airportsApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch airports');
    }
  }
);

export const fetchAirportById = createAsyncThunk(
  'airports/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await airportsApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch airport');
    }
  }
);

export const createAirport = createAsyncThunk(
  'airports/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await airportsApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create airport');
    }
  }
);

export const updateAirport = createAsyncThunk(
  'airports/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await airportsApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update airport');
    }
  }
);

export const deleteAirport = createAsyncThunk(
  'airports/delete',
  async (id, { rejectWithValue }) => {
    try {
      await airportsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete airport');
    }
  }
);

const airportsSlice = createSlice({
  name: 'airports',
  initialState: {
    items: [],
    total: 0,
    currentItem: null,
    loading: false,
    error: null,
    currentPage: 0,
    pageSize: 10,
    search: '',
  },
  reducers: {
    setPage: (state, action) => { state.currentPage = action.payload; },
    setPageSize: (state, action) => { state.pageSize = action.payload; },
    setSearch: (state, action) => { state.search = action.payload; },
    clearCurrentItem: (state) => { state.currentItem = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAirports.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAirports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchAirports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAirportById.pending, (state) => { state.loading = true; })
      .addCase(fetchAirportById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchAirportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAirport.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAirport.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentItem?.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(deleteAirport.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { setPage, setPageSize, setSearch, clearCurrentItem, clearError } =
  airportsSlice.actions;
export default airportsSlice.reducer;
