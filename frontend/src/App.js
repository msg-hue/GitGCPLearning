import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import GlobalStyles, { theme } from './styles/GlobalStyles';
import Layout from './layouts/Layout';
import {
  Dashboard,
  Projects,
  Tasks,
  Team,
  Calendar,
  Reports,
  Settings,
  Login
} from './pages';
import ModuleRouter from './pages/ModuleRouter';
import RequireAuth from './components/RequireAuth';
import PaymentPlanDetails from './pages/schedule/PaymentPlanDetails';
import CustomerPayments from './pages/payments/CustomerPayments';
import ProjectFormPage from './pages/property/ProjectFormPage';
import PaymentFormPage from './pages/payments/PaymentFormPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';

function App() {
  return (
  <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes - Login only, redirect if already authenticated */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes - All require authentication */}
          <Route path="/" element={<RequireAuth />}>
            <Route element={<Layout />}>
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Navigate to="/customers/all-customers" replace />} />
              <Route path="projects" element={<Projects />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="team" element={<Team />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              {/* Dynamic routes for new sidebar sections */}
              <Route path=":module" element={<ModuleRouter />} />
              <Route path=":module/:view" element={<ModuleRouter />} />
              {/* Explicit detail routes */}
              <Route path="schedule/payment-plans/:planId" element={<PaymentPlanDetails />} />
              <Route path="payments/customer/:customerId" element={<CustomerPayments />} />
              {/* Project form routes - full page view */}
              <Route path="property/projects/new" element={<ProjectFormPage />} />
              <Route path="property/projects/:projectId" element={<ProjectFormPage />} />
              <Route path="property/projects/:projectId/edit" element={<ProjectFormPage />} />
              {/* Payment form routes - full page view */}
              <Route path="payments/collections/new" element={<PaymentFormPage />} />
              <Route path="payments/collections/:paymentId" element={<PaymentFormPage />} />
              <Route path="payments/collections/:paymentId/edit" element={<PaymentFormPage />} />
              {/* Customer form routes - full page view */}
              <Route path="customers/all-customers/new" element={<CustomerFormPage />} />
              <Route path="customers/all-customers/:customerId" element={<CustomerFormPage />} />
              <Route path="customers/all-customers/:customerId/edit" element={<CustomerFormPage />} />
            </Route>
          </Route>
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;



