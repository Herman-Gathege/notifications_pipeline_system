// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken } from "@/hooks/use-api";
import Dashboard from "@/components/dashboard";
import LoginPage from "@/components/pages/login-page";
import DashboardPage from "@/components/pages/dashboard-page";
import ApplicationsPage from "@/components/pages/applications-page";
import ProvidersPage from "@/components/pages/providers-page";
import TemplatesPage from "@/components/pages/templates-page";
import EventsPage from "@/components/pages/events-page";
import NotificationsPage from "@/components/pages/notifications-page";
import MonitoringPage from "@/components/pages/monitoring-page";
import ReportsPage from "@/components/pages/reports-page";

function App() {
  const [token, setTokenState] = useState<string | null>(getToken());

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenState(getToken());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!token) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
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
    </Routes>
  );
}

export default App;
