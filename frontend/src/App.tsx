import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/layout/Layout';

// Public Gateway & Onboarding Pages
import { SplashScreen } from './pages/SplashScreen';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { VisitorAuthPage } from './pages/VisitorAuthPage';
import { VisitorPortalPage } from './pages/VisitorPortalPage';

// Staff Pages (Tier 1)
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
import { IncidentsPage } from './pages/IncidentsPage';
import { StaffPortalPage } from './pages/StaffPortalPage';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2000,
    },
  },
});

// Guard: Tier 1 Hospital Staff Only (Blocks Visitors & redirects clinical STAFF to their messaging portal)
const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/gateway" replace />;
  }
  if (user?.role === 'VISITOR') {
    return <Navigate to="/visitor" replace />;
  }
  if (user?.role === 'STAFF') {
    return <Navigate to="/staff" replace />;
  }
  return <>{children}</>;
};

// Guard: Clinical Staff Portal (Doctors, Nurses, Ward Staff)
const ClinicalStaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/gateway" replace />;
  }
  if (user?.role === 'VISITOR') {
    return <Navigate to="/visitor" replace />;
  }
  return <>{children}</>;
};

// Guard: Tier 2 Visitor Portal Only (Requires Auth)
const VisitorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/visitor-auth" replace />;
  }
  return <>{children}</>;
};

// Fallback resolver based on authentication and role
const FallbackRoute: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/gateway" replace />;
  }
  if (user?.role === 'VISITOR') {
    return <Navigate to="/visitor" replace />;
  }
  if (user?.role === 'STAFF') {
    return <Navigate to="/staff" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  const basename = (import.meta.env.BASE_URL || '/wesal/').replace(/\/$/, '') || '/wesal';

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              {/* Step 1: Splash Screen */}
              <Route path="/" element={<SplashScreen />} />

              {/* Step 2: Role Selection Gate */}
              <Route path="/gateway" element={<RoleSelectionPage />} />

              {/* Step 3A: Staff Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Step 3B: Frictionless Visitor Express Portal (No password required) */}
              <Route path="/visitor" element={<VisitorPortalPage />} />
              <Route path="/visitor-portal" element={<VisitorPortalPage />} />
              <Route path="/visitor-auth" element={<Navigate to="/visitor-portal" replace />} />

              {/* Step 3C: Clinical Staff Portal (Doctors & Nurses - Incident Messaging & Comments) */}
              <Route
                path="/staff"
                element={
                  <ClinicalStaffRoute>
                    <StaffPortalPage />
                  </ClinicalStaffRoute>
                }
              />
              <Route path="/staff-portal" element={<Navigate to="/staff" replace />} />

              {/* Tier 1: Hospital Staff Console (Full CRUD & Access Operations) */}
              <Route
                element={
                  <StaffRoute>
                    <Layout />
                  </StaffRoute>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="reception" element={<ReceptionPage />} />
                <Route path="passes" element={<VisitorPassPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
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
              <Route path="*" element={<FallbackRoute />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
