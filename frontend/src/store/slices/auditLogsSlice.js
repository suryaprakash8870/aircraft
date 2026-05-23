import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auditLogsApi } from '../../api/auditLogsApi';

export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await auditLogsApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit logs');
    }
  }
);

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
    currentPage: 0,
    pageSize: 20,
    filters: {
      dateFrom: null,
      dateTo: null,
      action: '',
      user: '',
    },
  },
  reducers: {
    setPage: (state, action) => { state.currentPage = action.payload; },
    setPageSize: (state, action) => { state.pageSize = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearFilters: (state) => {
      state.filters = { dateFrom: null, dateTo: null, action: '', user: '' };
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPage, setPageSize, setFilters, clearFilters, clearError } =
  auditLogsSlice.actions;
export default auditLogsSlice.reducer;
