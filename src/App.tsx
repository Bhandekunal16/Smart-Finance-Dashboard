import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApiConfigProvider } from './context/ApiConfigContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { QRCodePage } from './pages/QRCodePage';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

export default function App() {
  return (
    <ThemeProvider>
      <ApiConfigProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/qr" element={<QRCodePage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </ToastProvider>
      </ApiConfigProvider>
    </ThemeProvider>
  );
}
