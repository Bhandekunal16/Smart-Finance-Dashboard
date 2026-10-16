import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Moon,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const {
    baseUrl,
    activeUsername,
    setActiveUsername,
    isMasked,
    setIsMasked,
    healthStatus,
    healthMessage,
    healthLatency,
    checkHealth,
  } = useApiConfig();

  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [customUser, setCustomUser] = useState(activeUsername);
  const [checking, setChecking] = useState(false);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUser.trim()) return;
    setActiveUsername(customUser.trim());
    showToast({
      type: 'success',
      title: 'Active User Switched',
      message: `Active profile set to @${customUser.trim()}`,
    });
    window.dispatchEvent(new CustomEvent('finflow_data_mutated'));
  };

  const handleRunHealthCheck = async () => {
    setChecking(true);
    await checkHealth();
    setChecking(false);
    showToast({
      type: healthStatus === 'connected' ? 'success' : 'error',
      title: 'Health Check Complete',
      message: `GET / returned ${healthStatus} (${healthLatency || 0}ms)`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          API & System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Backend server status, active profile context, security masking, and UI theme
        </p>
      </div>

      {/* Backend Connection Card - Fixed without UI URL configuration */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Connected Express Backend
              </h2>
              <p className="text-xs text-slate-500 font-mono">{baseUrl}</p>
            </div>
          </div>

          {/* Live Ping Button */}
          <button
            type="button"
            onClick={handleRunHealthCheck}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Ping Server (GET /)</span>
          </button>
        </div>

        {/* Health Status Indicator */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            healthStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
              : healthStatus === 'checking'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {healthStatus === 'connected' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block">
                {healthStatus === 'connected' ? 'Backend Online & Reachable' : 'Backend Status'}
              </span>
              <span className="text-[11px] opacity-80">{healthMessage || 'Verifying connectivity...'}</span>
            </div>
          </div>
          {healthLatency !== null && (
            <span className="font-mono font-bold text-[11px] tabular-nums">
              {healthLatency}ms latency
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 pt-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Server endpoints are active in full read-write mode.</span>
        </div>
      </div>

      {/* Active User Switcher */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Active User Context
            </h2>
            <p className="text-xs text-slate-500">
              App queries and records transactions under this user handle
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveUser} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-semibold">
              @
            </span>
            <input
              type="text"
              value={customUser}
              onChange={(e) => setCustomUser(e.target.value)}
              placeholder="asha"
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap"
          >
            Switch User
          </button>
        </form>
      </div>

      {/* Security & Display Preferences */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
          Security & Appearance
        </h2>

        {/* Masking Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Mask Sensitive Account Numbers by Default
            </span>
            <p className="text-[11px] text-slate-500">
              Hides bank account numbers as •••• •••• 6789 unless manually unmasked
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMasked(!isMasked)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isMasked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle masking"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isMasked ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Theme Segmented Switcher */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Interface Theme
            </span>
            <p className="text-[11px] text-slate-500">
              Switch between Light and Dark color palettes
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Express API Endpoint Spec Reference Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Active API Endpoints Reference
        </h2>
        <p className="text-xs text-slate-500">
          All endpoints execute against <code>{baseUrl}</code>
        </p>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Endpoint</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2 text-emerald-600">GET</td>
                <td className="py-2">/</td>
                <td className="py-2 font-sans text-slate-500">API Health check response</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/create</td>
                <td className="py-2 font-sans text-slate-500">Create user document with bank accounts</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/create/payment</td>
                <td className="py-2 font-sans text-slate-500">Record transaction & adjust account balance</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/add/budget</td>
                <td className="py-2 font-sans text-slate-500">Insert monthly spending budget</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/get/account</td>
                <td className="py-2 font-sans text-slate-500">Retrieve user & account details</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/get/txn</td>
                <td className="py-2 font-sans text-slate-500">Retrieve sorted transactions</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/get/budget</td>
                <td className="py-2 font-sans text-slate-500">Retrieve budget documents</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/update/budget</td>
                <td className="py-2 font-sans text-slate-500">Update budget amount</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/get/txn/statistics</td>
                <td className="py-2 font-sans text-slate-500">Aggregate date-wise statistics & totals</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/get/monthly/txn</td>
                <td className="py-2 font-sans text-slate-500">Calculate current month debit total</td>
              </tr>
              <tr>
                <td className="py-2 text-blue-600">POST</td>
                <td className="py-2">/get/qr</td>
                <td className="py-2 font-sans text-slate-500">Generate payment QR code data URLs</td>
              </tr>
              <tr>
                <td className="py-2 text-emerald-600">GET</td>
                <td className="py-2">/send/report/</td>
                <td className="py-2 font-sans text-slate-500">Trigger 30-day report generation & email</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
