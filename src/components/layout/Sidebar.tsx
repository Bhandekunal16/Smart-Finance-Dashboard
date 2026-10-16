import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  PieChart,
  QrCode,
  FileBarChart2,
  Settings as SettingsIcon,
  X,
  Building2,
  Server,
  Sparkles,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useApiConfig } from '../../context/ApiConfigContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts & Profile', icon: WalletCards },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budget Management', icon: PieChart },
  { to: '/qr', label: 'Payment QR Codes', icon: QrCode },
  { to: '/reports', label: 'Reports & Analytics', icon: FileBarChart2 },
  { to: '/settings', label: 'API & Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeUsername, isSimulation, healthStatus, baseUrl } = useApiConfig();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block">
                  FinFlow
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  Express API Hub
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Profile Badge / Login Option */}
          <div className="mx-4 my-3 p-3 rounded-xl bg-slate-800/80 border border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">
                  SIGNED IN
                </span>
                <span className="text-sm font-semibold text-white block truncate">
                  @{activeUsername}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 uppercase">
                {activeUsername.slice(0, 2)}
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-750 flex items-center justify-between text-[11px]">
              <NavLink
                to="/login"
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <LogIn className="w-3 h-3" />
                <span>Switch / Login</span>
              </NavLink>

              <NavLink
                to="/accounts"
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
                className="text-slate-400 hover:text-white"
              >
                Profile →
              </NavLink>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Backend Connectivity Status in Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Backend Status
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'connected'
                    ? 'bg-emerald-500'
                    : healthStatus === 'checking'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
                title={`Status: ${healthStatus}`}
              />
            </div>
            <p className="text-[11px] text-slate-400 truncate" title={baseUrl}>
              {isSimulation ? 'In-Memory Simulator' : baseUrl}
            </p>
            {isSimulation && (
              <span className="mt-1 text-[10px] text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Demo Mode Enabled
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
