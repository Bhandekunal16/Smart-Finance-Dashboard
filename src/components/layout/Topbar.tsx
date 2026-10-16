import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Eye,
  EyeOff,
  RefreshCw,
  PlusCircle,
  QrCode,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApiConfig } from '../../context/ApiConfigContext';

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenNewTransaction?: () => void;
  onOpenNewBudget?: () => void;
  title: string;
  breadcrumb?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenNewTransaction,
  title,
  breadcrumb = 'FinFlow Hub',
}) => {
  const { theme, toggleTheme } = useTheme();
  const {
    isMasked,
    toggleMasking,
    checkHealth,
    healthStatus,
    activeUsername,
  } = useApiConfig();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Breadcrumb and Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{breadcrumb}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
              {title}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2 & 3: Controls & Primary Action */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Toggle Account Masking */}
        <button
          type="button"
          onClick={toggleMasking}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isMasked ? 'Reveal account numbers' : 'Mask sensitive account numbers'}
          aria-label="Toggle masking"
        >
          {isMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Health / Refresh Ping */}
        <button
          type="button"
          onClick={() => checkHealth()}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Backend status: ${healthStatus}. Click to refresh`}
          aria-label="Check backend connectivity"
        >
          <RefreshCw className={`w-4 h-4 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Account / Login Option */}
        <UserMenu />

        {/* Primary Action Button */}
        {onOpenNewTransaction && (
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>
    </header>
  );
};

const UserMenu: React.FC = () => {
  const { activeUsername, currentUser, isAuthenticated, logout } = useApiConfig();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {isAuthenticated ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
            @{activeUsername}
          </span>
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center uppercase">
            {activeUsername.slice(0, 2)}
          </div>
        </button>
      ) : (
        <a
          href="#/login"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
        >
          <span>Log In</span>
        </a>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1.5 animate-in fade-in duration-100">
            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Signed in as</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                {currentUser?.name || `@${activeUsername}`}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                @{activeUsername}
              </span>
            </div>

            <div className="py-1">
              <a
                href="#/accounts"
                onClick={() => setIsOpen(false)}
                className="block px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Profile & Accounts
              </a>
              <a
                href="#/login"
                onClick={() => setIsOpen(false)}
                className="block px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Switch Account
              </a>
            </div>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  window.location.href = '#/login';
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

