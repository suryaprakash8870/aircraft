import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aircraftsApi } from '../../api/aircraftsApi';

export const fetchAircrafts = createAsyncThunk(
  'aircrafts/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await aircraftsApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch aircrafts');
    }
  }
);

export const fetchAircraftById = createAsyncThunk(
  'aircrafts/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await aircraftsApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch aircraft');
    }
  }
);

export const createAircraft = createAsyncThunk(
  'aircrafts/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await aircraftsApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create aircraft');
    }
  }
);

export const updateAircraft = createAsyncThunk(
  'aircrafts/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await aircraftsApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update aircraft');
    }
  }
);

export const deleteAircraft = createAsyncThunk(
  'aircrafts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await aircraftsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete aircraft');
    }
  }
);

const aircraftsSlice = createSlice({
  name: 'aircrafts',
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
      .addCase(fetchAircrafts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAircrafts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchAircrafts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAircraftById.pending, (state) => { state.loading = true; })
      .addCase(fetchAircraftById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchAircraftById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAircraft.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAircraft.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentItem?.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(deleteAircraft.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { setPage, setPageSize, setSearch, clearCurrentItem, clearError } =
  aircraftsSlice.actions;
export default aircraftsSlice.reducer;
