import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  User,
  ExternalLink,
  ShieldAlert,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const {
    baseUrl,
    setBaseUrl,
    activeUsername,
    setActiveUsername,
    isSimulation,
    setSimulation,
    isMasked,
    setIsMasked,
    healthStatus,
    healthMessage,
    healthLatency,
    checkHealth,
    resetToDefaults,
  } = useApiConfig();

  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [customUrl, setCustomUrl] = useState(baseUrl);
  const [customUser, setCustomUser] = useState(activeUsername);
  const [checking, setChecking] = useState(false);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setBaseUrl(customUrl.trim());
    showToast({
      type: 'success',
      title: 'API Base URL Updated',
      message: `Connecting to ${customUrl.trim()}`,
    });
  };

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
          API Configuration & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure Express.js backend targets, active profile, security masking, and UI theme
        </p>
      </div>

      {/* Backend Connection Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Express Backend Target
              </h2>
              <p className="text-xs text-slate-500">Central Axios client base URL</p>
            </div>
          </div>

          {/* Live Ping Button */}
          <button
            type="button"
            onClick={handleRunHealthCheck}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Ping GET /</span>
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
                {healthStatus === 'connected' ? 'Backend Online & Reachable' : 'Backend Unreachable'}
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

        {/* Quick URL Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Target Environment Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomUrl('http://localhost:4000');
                setBaseUrl('http://localhost:4000');
                setSimulation(false);
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                baseUrl === 'http://localhost:4000' && !isSimulation
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Direct Backend Port
              </span>
              <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                http://localhost:4000
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomUrl('http://localhost:8000');
                setBaseUrl('http://localhost:8000');
                setSimulation(false);
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                baseUrl === 'http://localhost:8000' && !isSimulation
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Reverse Proxy Port
              </span>
              <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                http://localhost:8000
              </span>
            </button>
          </div>
        </div>

        {/* Custom URL Form */}
        <form onSubmit={handleSaveUrl} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Custom Base URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:4000"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap"
            >
              Update URL
            </button>
          </div>
        </form>

        {/* Demo Simulator Toggle */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              In-Browser Demo Simulator
            </span>
            <p className="text-[11px] text-slate-500">
              Emulates all 12 Express endpoints in local storage when testing without a running backend
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSimulation(!isSimulation)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isSimulation ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle demo simulator"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isSimulation ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
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
              App queries and records transactions under this username
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

        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500">Suggested demo username:</span>
          <button
            type="button"
            onClick={() => {
              setCustomUser('asha');
              setActiveUsername('asha');
              window.dispatchEvent(new CustomEvent('finflow_data_mutated'));
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-medium"
          >
            @asha (from API documentation)
          </button>
        </div>
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

        {/* Reset to Defaults */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => {
              resetToDefaults();
              setCustomUrl('http://localhost:4000');
              setCustomUser('asha');
              showToast({
                type: 'info',
                title: 'Settings Reset',
                message: 'Base URL and user reset to initial defaults.',
              });
            }}
            className="px-3.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
          >
            Reset All to Defaults
          </button>
        </div>
      </div>

      {/* Express API Endpoint Spec Reference Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Implemented API Endpoints Reference
        </h2>
        <p className="text-xs text-slate-500">
          Mapped directly from <code>api(20261016-094625).md</code>
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
