import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, RefreshCw, Sparkles, Settings } from 'lucide-react';
import { useApiConfig } from '../../context/ApiConfigContext';

export const ApiStatusBar: React.FC = () => {
  const {
    healthStatus,
    healthMessage,
    healthLatency,
    baseUrl,
    isSimulation,
    setSimulation,
    checkHealth,
  } = useApiConfig();

  // If in simulation mode, show quiet banner with option to switch back to live backend
  if (isSimulation) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/50 px-4 py-2 text-xs text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Demo Simulator Active:</strong> Using local storage in-memory API matching the 12 Express endpoints.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSimulation(false)}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
          >
            Switch to Live Backend ({baseUrl})
          </button>
          <Link
            to="/settings"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Config
          </Link>
        </div>
      </div>
    );
  }

  // If disconnected from real backend
  if (healthStatus === 'disconnected') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Backend Unreachable at {baseUrl}:</strong> {healthMessage || 'Is your Express server running on port 4000?'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => checkHealth()}
            className="px-2.5 py-1 bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 rounded-md font-medium hover:bg-amber-300 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
          <button
            type="button"
            onClick={() => setSimulation(true)}
            className="px-2.5 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
          >
            <Sparkles className="w-3 h-3" />
            Enable Demo Simulator
          </button>
          <Link
            to="/settings"
            className="underline font-medium text-amber-900 dark:text-amber-200"
          >
            Settings
          </Link>
        </div>
      </div>
    );
  }

  return null;
};
