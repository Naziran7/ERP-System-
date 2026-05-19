import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/hr/EmployeeList';
import PayrollList from './pages/payroll/PayrollList';
import InventoryList from './pages/inventory/InventoryList';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import CRMModule from './pages/crm/CRMModule';
import SalesInvoiceModule from './pages/sales/SalesInvoiceModule';
import AttendanceLeaveModule from './pages/attendance/AttendanceLeaveModule';
import SupplierPurchaseModule from './pages/purchase/SupplierPurchaseModule';
import ReportsAnalyticsModule from './pages/reports/ReportsAnalyticsModule';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hr/employees" element={<EmployeeList />} />
            <Route path="payroll" element={<ProtectedRoute roles={['admin', 'hr_manager', 'finance_manager']}><PayrollList /></ProtectedRoute>} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="finance" element={<ProtectedRoute roles={['admin', 'finance_manager']}><FinanceDashboard /></ProtectedRoute>} />
            <Route path="crm" element={<CRMModule />} />
            <Route path="sales" element={<ProtectedRoute roles={['admin', 'finance_manager']}><SalesInvoiceModule /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute roles={['admin', 'hr_manager', 'employee']}><AttendanceLeaveModule /></ProtectedRoute>} />
            <Route path="purchase" element={<ProtectedRoute roles={['admin', 'inventory_manager']}><SupplierPurchaseModule /></ProtectedRoute>} />
            <Route path="reports" element={<ReportsAnalyticsModule />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
