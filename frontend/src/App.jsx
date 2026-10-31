import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';

// Module 4 Pages
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { CustomerPortal } from './pages/CustomerPortal';
import { Login } from './pages/Login';

// Module 1 Pages
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { UserManagement } from './pages/UserManagement';

// Integration Mount Points for Modules 2 and 3
import { PlansIntegrationPage } from './pages/modules/PlansIntegrationPage'; // Module 2
import { SubscriptionsIntegrationPage } from './pages/modules/SubscriptionsIntegrationPage'; // Module 2
import { InvoicesIntegrationPage } from './pages/modules/InvoicesIntegrationPage'; // Module 3
import { PaymentsIntegrationPage } from './pages/modules/PaymentsIntegrationPage'; // Module 3

/**
 * Route Guard checking authentication & role requirements
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isCustomer } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
    if (isCustomer) {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Root Redirect Handler based on Role
 */
const RootRedirect = () => {
  const { isAuthenticated, isCustomer } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isCustomer ? <Navigate to="/portal" replace /> : <Navigate to="/dashboard" replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root Role Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Application Frame */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* MODULE 4: Executive Dashboard & Analytics */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* MODULE 4: Financial Reports & Ledger */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* MODULE 4: Customer Self-Service Portal */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute>
                  <CustomerPortal />
                </ProtectedRoute>
              }
            />

            {/* MODULE 1: Users & Roles Management */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* MODULE 2 INTEGRATION: Products & Plans */}
            <Route
              path="/plans"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <PlansIntegrationPage />
                </ProtectedRoute>
              }
            />

            {/* MODULE 2 INTEGRATION: Subscriptions */}
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <SubscriptionsIntegrationPage />
                </ProtectedRoute>
              }
            />

            {/* MODULE 3 INTEGRATION: Invoices */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <InvoicesIntegrationPage />
                </ProtectedRoute>
              }
            />

            {/* MODULE 3 INTEGRATION: Payments */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <PaymentsIntegrationPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
