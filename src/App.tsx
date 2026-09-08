import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { StockManagementPage } from './pages/StockManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { LabelPrintingPage } from './pages/LabelPrintingPage';
import { BillPrintPage } from './pages/BillPrintPage';
import { SettingsPage } from './pages/SettingsPage';
import { usePosStore } from './store/usePosStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = usePosStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="stock" element={<StockManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="labels" element={<LabelPrintingPage />} />
          <Route path="bill-print" element={<BillPrintPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
