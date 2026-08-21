// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import Dashboard from "@/components/dashboard";
import LoginPage from "@/components/pages/login-page";
import RegisterPage from "@/components/pages/register-page";
import DashboardPage from "@/components/pages/dashboard-page";
import ApplicationsPage from "@/components/pages/applications-page";
import ProvidersPage from "@/components/pages/providers-page";
import TemplatesPage from "@/components/pages/templates-page";
import EventsPage from "@/components/pages/events-page";
import NotificationsPage from "@/components/pages/notifications-page";
import MonitoringPage from "@/components/pages/monitoring-page";
import ReportsPage from "@/components/pages/reports-page";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (!token) {
    return <LoginPage />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
