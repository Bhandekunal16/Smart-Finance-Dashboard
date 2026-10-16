import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useApiConfig } from '../../context/ApiConfigContext';

export const ApiStatusBar: React.FC = () => {
  const { healthStatus, healthMessage, baseUrl, checkHealth } = useApiConfig();

  // If disconnected from backend
  if (healthStatus === 'disconnected') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Connecting to Backend ({baseUrl}):</strong> {healthMessage || 'Verifying network connectivity...'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => checkHealth()}
          className="px-2.5 py-1 bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 rounded-md font-medium hover:bg-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Retry Connection
        </button>
      </div>
    );
  }

  return null;
};
