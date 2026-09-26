import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReceptionPage } from './pages/ReceptionPage';
import { VisitorPassPage } from './pages/VisitorPassPage';
import { GateScannerPage } from './pages/GateScannerPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { VisitorsListPage } from './pages/VisitorsListPage';
import { VisitorDetailPage } from './pages/VisitorDetailPage';
import { PatientsListPage } from './pages/PatientsListPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CheckpointsPage } from './pages/CheckpointsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoControlPage } from './pages/DemoControlPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const basename = (import.meta.env.BASE_URL || '/wesal/').replace(/\/$/, '') || '/wesal';

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Authenticated Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="reception" element={<ReceptionPage />} />
                <Route path="passes" element={<VisitorPassPage />} />
                <Route path="gate" element={<GateScannerPage />} />
                <Route path="live" element={<LiveMonitorPage />} />
                <Route path="visitors" element={<VisitorsListPage />} />
                <Route path="visitors/:id" element={<VisitorDetailPage />} />
                <Route path="patients" element={<PatientsListPage />} />
                <Route path="patients/:id" element={<PatientDetailPage />} />
                <Route path="checkpoints" element={<CheckpointsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="demo" element={<DemoControlPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
