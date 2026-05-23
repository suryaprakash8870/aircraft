import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fuelAgentsApi } from '../../api/fuelAgentsApi';

export const fetchFuelAgents = createAsyncThunk(
  'fuelAgents/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fuelAgentsApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fuel agents');
    }
  }
);

export const fetchFuelAgentById = createAsyncThunk(
  'fuelAgents/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fuelAgentsApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fuel agent');
    }
  }
);

export const createFuelAgent = createAsyncThunk(
  'fuelAgents/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await fuelAgentsApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create fuel agent');
    }
  }
);

export const updateFuelAgent = createAsyncThunk(
  'fuelAgents/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await fuelAgentsApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update fuel agent');
    }
  }
);

export const deleteFuelAgent = createAsyncThunk(
  'fuelAgents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await fuelAgentsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete fuel agent');
    }
  }
);

const fuelAgentsSlice = createSlice({
  name: 'fuelAgents',
  initialState: {
    items: [],
    total: 0,
    currentItem: null,
    loading: false,
    error: null,
    currentPage: 0,
    pageSize: 10,
    search: '',
    statusFilter: '',
  },
  reducers: {
    setPage: (state, action) => { state.currentPage = action.payload; },
    setPageSize: (state, action) => { state.pageSize = action.payload; },
    setSearch: (state, action) => { state.search = action.payload; },
    setStatusFilter: (state, action) => { state.statusFilter = action.payload; },
    clearCurrentItem: (state) => { state.currentItem = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelAgents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFuelAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchFuelAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFuelAgentById.pending, (state) => { state.loading = true; })
      .addCase(fetchFuelAgentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchFuelAgentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFuelAgent.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateFuelAgent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentItem?.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(deleteFuelAgent.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { setPage, setPageSize, setSearch, setStatusFilter, clearCurrentItem, clearError } =
  fuelAgentsSlice.actions;
export default fuelAgentsSlice.reducer;
