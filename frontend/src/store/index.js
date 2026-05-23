import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import fuelAgentsReducer from './slices/fuelAgentsSlice';
import airportsReducer from './slices/airportsSlice';
import fuelPurchasesReducer from './slices/fuelPurchasesSlice';
import fuelStockReducer from './slices/fuelStockSlice';
import aircraftsReducer from './slices/aircraftsSlice';
import aircraftFillingReducer from './slices/aircraftFillingSlice';
import dashboardReducer from './slices/dashboardSlice';
import uiReducer from './slices/uiSlice';
import usersReducer from './slices/usersSlice';
import auditLogsReducer from './slices/auditLogsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    fuelAgents: fuelAgentsReducer,
    airports: airportsReducer,
    fuelPurchases: fuelPurchasesReducer,
    fuelStock: fuelStockReducer,
    aircrafts: aircraftsReducer,
    aircraftFilling: aircraftFillingReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
    users: usersReducer,
    auditLogs: auditLogsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['fuelPurchases/create', 'fuelPurchases/update'],
        ignoredPaths: ['fuelPurchases.filters.dateFrom', 'fuelPurchases.filters.dateTo'],
      },
    }),
});

export default store;
