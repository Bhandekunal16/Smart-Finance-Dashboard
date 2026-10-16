import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'neutral' | 'credit' | 'debit' | 'highlight';
  trend?: {
    text: string;
    positive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'neutral',
  trend,
}) => {
  const iconColors = {
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    credit: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    debit: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    highlight: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
  };

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1 tabular-nums">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${iconColors[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          {trend && (
            <span
              className={`font-medium tabular-nums ${
                trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.text}
            </span>
          )}
          {trend && subtext && <span aria-hidden="true">·</span>}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};
