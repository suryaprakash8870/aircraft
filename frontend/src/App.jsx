import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMeThunk } from './store/slices/authSlice';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import SnackbarAlert from './components/common/SnackbarAlert';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import FuelAgentsPage from './pages/fuel-agents/FuelAgentsPage';
import FuelAgentFormPage from './pages/fuel-agents/FuelAgentFormPage';
import AirportsPage from './pages/airports/AirportsPage';
import AirportFormPage from './pages/airports/AirportFormPage';
import FuelPurchasesPage from './pages/fuel-purchases/FuelPurchasesPage';
import FuelPurchaseFormPage from './pages/fuel-purchases/FuelPurchaseFormPage';
import FuelPurchaseDetailPage from './pages/fuel-purchases/FuelPurchaseDetailPage';
import FuelStockPage from './pages/fuel-stock/FuelStockPage';
import AircraftsPage from './pages/aircrafts/AircraftsPage';
import AircraftFormPage from './pages/aircrafts/AircraftFormPage';
import AircraftFillingPage from './pages/aircraft-filling/AircraftFillingPage';
import AircraftFillingFormPage from './pages/aircraft-filling/AircraftFillingFormPage';
import AircraftFillingDetailPage from './pages/aircraft-filling/AircraftFillingDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';
import UserFormPage from './pages/users/UserFormPage';
import AuditLogsPage from './pages/audit-logs/AuditLogsPage';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { token, user, isAuthenticated } = useSelector((state) => state.auth);
  const [initializing, setInitializing] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        await dispatch(getMeThunk());
      }
      setInitializing(false);
    };
    init();
  }, [token, dispatch]);

  if (initializing) {
    return <LoadingScreen message="Initializing AeroFuel..." />;
  }

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><DashboardPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-agents"
          element={
            <ProtectedRoute>
              <Layout><FuelAgentsPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-agents/new"
          element={
            <ProtectedRoute>
              <Layout><FuelAgentFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-agents/:id/edit"
          element={
            <ProtectedRoute>
              <Layout><FuelAgentFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/airports"
          element={
            <ProtectedRoute>
              <Layout><AirportsPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/airports/new"
          element={
            <ProtectedRoute>
              <Layout><AirportFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/airports/:id/edit"
          element={
            <ProtectedRoute>
              <Layout><AirportFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-purchases"
          element={
            <ProtectedRoute>
              <Layout><FuelPurchasesPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-purchases/new"
          element={
            <ProtectedRoute>
              <Layout><FuelPurchaseFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-purchases/:id"
          element={
            <ProtectedRoute>
              <Layout><FuelPurchaseDetailPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-purchases/:id/edit"
          element={
            <ProtectedRoute>
              <Layout><FuelPurchaseFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-stock"
          element={
            <ProtectedRoute>
              <Layout><FuelStockPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircrafts"
          element={
            <ProtectedRoute>
              <Layout><AircraftsPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircrafts/new"
          element={
            <ProtectedRoute>
              <Layout><AircraftFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircrafts/:id/edit"
          element={
            <ProtectedRoute>
              <Layout><AircraftFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircraft-filling"
          element={
            <ProtectedRoute>
              <Layout><AircraftFillingPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircraft-filling/new"
          element={
            <ProtectedRoute>
              <Layout><AircraftFillingFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircraft-filling/:id"
          element={
            <ProtectedRoute>
              <Layout><AircraftFillingDetailPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aircraft-filling/:id/edit"
          element={
            <ProtectedRoute>
              <Layout><AircraftFillingFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout><ReportsPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Only */}
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Layout><UsersPage /></Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <AdminRoute>
              <Layout><UserFormPage /></Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <AdminRoute>
              <Layout><UserFormPage /></Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <AdminRoute>
              <Layout><AuditLogsPage /></Layout>
            </AdminRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <SnackbarAlert />
    </>
  );
};

export default App;
