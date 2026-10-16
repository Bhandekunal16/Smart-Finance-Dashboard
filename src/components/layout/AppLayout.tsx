import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ApiStatusBar } from './ApiStatusBar';
import { AddTransactionModal } from '../transactions/AddTransactionModal';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard', breadcrumb: 'Overview' };
      case '/login':
        return { title: 'Sign In', breadcrumb: 'Authentication' };
      case '/accounts':
        return { title: 'Accounts & Profile', breadcrumb: 'Banking' };
      case '/transactions':
        return { title: 'Transactions Ledger', breadcrumb: 'Ledger' };
      case '/budgets':
        return { title: 'Budget Management', breadcrumb: 'Planning' };
      case '/qr':
        return { title: 'Payment QR Codes', breadcrumb: 'Payments' };
      case '/reports':
        return { title: 'Reports & Analytics', breadcrumb: 'Insights' };
      case '/settings':
        return { title: 'API & Settings', breadcrumb: 'System' };
      default:
        return { title: 'FinFlow Hub', breadcrumb: 'Home' };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <ApiStatusBar />
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenNewTransaction={() => setIsAddTxnOpen(true)}
          title={meta.title}
          breadcrumb={meta.breadcrumb}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openAddTxn: () => setIsAddTxnOpen(true) }} />
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxnOpen}
        onClose={() => setIsAddTxnOpen(false)}
        onSuccess={() => {
          setIsAddTxnOpen(false);
          // Trigger a custom event to notify components to refresh
          window.dispatchEvent(new CustomEvent('finflow_data_mutated'));
        }}
      />
    </div>
  );
};
