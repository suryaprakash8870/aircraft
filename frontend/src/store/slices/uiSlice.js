import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    snackbar: {
      open: false,
      message: '',
      severity: 'success', // 'success' | 'error' | 'warning' | 'info'
      duration: 4000,
    },
    confirmDialog: {
      open: false,
      title: '',
      message: '',
      loading: false,
      variant: 'default', // 'default' | 'danger'
      onConfirmId: null, // store id for the callback
    },
    sidebarOpen: true,
  },
  reducers: {
    showSnackbar: (state, action) => {
      state.snackbar.open = true;
      state.snackbar.message = action.payload.message;
      state.snackbar.severity = action.payload.severity || 'success';
      state.snackbar.duration = action.payload.duration || 4000;
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    showConfirmDialog: (state, action) => {
      state.confirmDialog.open = true;
      state.confirmDialog.title = action.payload.title || 'Confirm Action';
      state.confirmDialog.message = action.payload.message || 'Are you sure?';
      state.confirmDialog.variant = action.payload.variant || 'default';
      state.confirmDialog.loading = false;
    },
    hideConfirmDialog: (state) => {
      state.confirmDialog.open = false;
      state.confirmDialog.loading = false;
    },
    setConfirmDialogLoading: (state, action) => {
      state.confirmDialog.loading = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  showSnackbar,
  hideSnackbar,
  showConfirmDialog,
  hideConfirmDialog,
  setConfirmDialogLoading,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
