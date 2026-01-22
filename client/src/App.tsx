import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store, useAppDispatch, useAppSelector } from './store';
import { getCurrentUser, initializeAuth } from './store/slices/authSlice';
import { Toast } from './components/ui';
import { socketService } from './services/socket.service';
import MainLayout from './components/layout/MainLayout';
import { downloadDataForOffline } from './services/offline/syncService';
import { processSyncQueue } from './services/offline/syncProcessor';
import { useNetworkStatusWithCallbacks } from './hooks/useNetworkStatus';
import muiTheme, { darkMuiTheme } from './theme/muiTheme';

// Lazy load pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const PINLoginPage = React.lazy(() => import('./pages/auth/PINLoginPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard'));
const POSPage = React.lazy(() => import('./pages/pos'));
const ProductsPage = React.lazy(() => import('./pages/products'));
const CustomersPage = React.lazy(() => import('./pages/customers'));
const ReportsPage = React.lazy(() => import('./pages/reports'));
const SessionsPage = React.lazy(() => import('./pages/sessions'));
const AlertsPage = React.lazy(() => import('./pages/alerts'));
const SettingsPage = React.lazy(() => import('./pages/settings'));
const StockPage = React.lazy(() => import('./pages/stock'));
const PriceImportPage = React.lazy(() => import('./pages/prices'));
const LoyaltyPage = React.lazy(() => import('./pages/loyalty'));
const InvoicesPage = React.lazy(() => import('./pages/invoices'));
const SuppliersPage = React.lazy(() => import('./pages/suppliers'));
const ShippingPage = React.lazy(() => import('./pages/shipping'));
const ExpensesPage = React.lazy(() => import('./pages/expenses'));
const AlertSettingsPage = React.lazy(() => import('./pages/settings/AlertSettings'));
const ChatPage = React.lazy(() => import('./pages/chat'));

// Loading fallback
const PageLoader = () => (
  <></>
  // <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
  //   <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
  // </div>
);

// Protected Route wrapper component using Outlet
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    // Token exists but user not loaded yet - show loader
    return <PageLoader />;
  }

  return <Outlet />;
};

// Layout wrapper component using Outlet
const LayoutWrapper: React.FC = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Auth check and socket connection
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, currentBranch, currentSession } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [token, isAuthenticated, dispatch]);

  useEffect(() => {
    if (token && isAuthenticated) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [token, isAuthenticated]);

  // Download data for offline use when authenticated
  useEffect(() => {
    const downloadOfflineData = async () => {
      if (isAuthenticated && currentBranch?.id) {
        console.log('[App] Downloading data for offline use...', { branchId: currentBranch.id });
        try {
          const success = await downloadDataForOffline(currentBranch.id);
          if (success) {
            console.log('[App] Offline data downloaded successfully');
          } else {
            console.warn('[App] Failed to download offline data');
          }
        } catch (error) {
          console.error('[App] Error downloading offline data:', error);
        }
      }
    };

    downloadOfflineData();

    // Refresh offline data every 30 minutes
    const interval = setInterval(downloadOfflineData, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentBranch]);

  // Auto-sync when network is restored
  useNetworkStatusWithCallbacks(
    async () => {
      // Network restored - sync pending operations
      if (isAuthenticated && currentBranch && currentSession) {
        console.log('[App] Network restored - starting auto-sync...');
        try {
          const result = await processSyncQueue(currentBranch.id, currentSession.register_id);
          if (result.success && result.processed > 0) {
            console.log(`[App] Auto-sync completed: ${result.processed} operations synced`);
          }
        } catch (error) {
          console.error('[App] Auto-sync error:', error);
        }

        // Also refresh offline data
        try {
          await downloadDataForOffline(currentBranch.id);
        } catch (error) {
          console.error('[App] Error refreshing offline data:', error);
        }
      }
    },
    () => {
      // Network lost
      console.log('[App] Network connection lost - switching to offline mode');
    }
  );

  return <>{children}</>;
};

// Main App Router with MUI Theme
const AppRouter: React.FC = () => {
  // Detect dark mode from localStorage or system preference
  const isDarkMode = useMemo(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const theme = useMemo(() => (isDarkMode ? darkMuiTheme : muiTheme), [isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Toast />
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pin-login" element={<PINLoginPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                {/* POS route - full screen without layout */}
                <Route path="/pos" element={<POSPage />} />

                {/* Routes with MainLayout */}
                <Route element={<LayoutWrapper />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products/*" element={<ProductsPage />} />
                  <Route path="/customers/*" element={<CustomersPage />} />
                  <Route path="/reports/*" element={<ReportsPage />} />
                  <Route path="/sessions/*" element={<SessionsPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/settings/*" element={<SettingsPage />} />
                  <Route path="/settings/alerts" element={<AlertSettingsPage />} />
                  <Route path="/stock/*" element={<StockPage />} />
                  <Route path="/prices/*" element={<PriceImportPage />} />
                  <Route path="/suppliers/*" element={<SuppliersPage />} />
                  <Route path="/loyalty/*" element={<LoyaltyPage />} />
                  <Route path="/invoices/*" element={<InvoicesPage />} />
                  <Route path="/shipping/*" element={<ShippingPage />} />
                  <Route path="/expenses/*" element={<ExpensesPage />} />
                  <Route path="/chat/*" element={<ChatPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
          </React.Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

// Root App with Redux Provider
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;
