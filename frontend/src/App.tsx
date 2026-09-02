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
import UsersPage from "@/components/pages/users-page";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-none border-2 border-black border-t-[var(--brand-orange)]" />
        <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Loading FikaTu
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!token) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;