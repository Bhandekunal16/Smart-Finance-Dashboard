import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart as PieIcon,
  Plus,
  Edit3,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  Calendar,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useToast } from '../context/ToastContext';
import { budgetApi } from '../api/budgetApi';
import { transactionApi } from '../api/transactionApi';
import { Budget } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CreateBudgetModal } from '../components/budgets/CreateBudgetModal';
import { UpdateBudgetModal } from '../components/budgets/UpdateBudgetModal';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';

export const Budgets: React.FC = () => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyDebit, setMonthlyDebit] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState<boolean>(false);

  const fetchBudgetData = useCallback(async () => {
    if (!activeUsername) return;
    try {
      const [bgtRes, monthlyRes] = await Promise.all([
        budgetApi.getBudgets({ username: activeUsername }),
        transactionApi.getMonthlyDebit({ username: activeUsername }),
      ]);

      if (bgtRes.success && Array.isArray(bgtRes.data)) {
        setBudgets(bgtRes.data);
      } else {
        setBudgets([]);
      }

      if (monthlyRes.success && typeof monthlyRes.data === 'number') {
        setMonthlyDebit(monthlyRes.data);
      } else {
        setMonthlyDebit(0);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Fetching Budgets',
        message: err.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUsername, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchBudgetData();
  }, [fetchBudgetData]);

  const primaryBudget = budgets.length > 0 ? budgets[0] : null;
  const budgetAmount = primaryBudget?.amount || 0;
  const utilization = budgetAmount > 0 ? (monthlyDebit / budgetAmount) * 100 : 0;
  const remaining = Math.max(0, budgetAmount - monthlyDebit);
  const isOverBudget = monthlyDebit > budgetAmount;
  const isApproaching = utilization >= 80 && !isOverBudget;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Budget Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor and enforce spending thresholds against monthly debit transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchBudgetData();
            }}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Reload budget"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {primaryBudget ? (
            <button
              type="button"
              onClick={() => setIsUpdateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Budget Amount</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Budget</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : primaryBudget ? (
        <div className="space-y-6">
          {/* Main Utilization Hero Card */}
          <div
            className={`p-6 rounded-2xl border shadow-xs transition-colors ${
              isOverBudget
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                : isApproaching
                ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      isOverBudget
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200'
                        : isApproaching
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200'
                    }`}
                  >
                    {isOverBudget ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> Budget Exceeded
                      </>
                    ) : isApproaching ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" /> Spending Warning (≥80%)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Budget
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    User: @{primaryBudget.username}
                  </span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {formatCurrency(monthlyDebit)} spent of {formatCurrency(budgetAmount)} ceiling
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isOverBudget
                    ? `You have exceeded your monthly allowance by ${formatCurrency(monthlyDebit - budgetAmount)}. Consider updating your budget or curbing outgoing transactions.`
                    : `${formatCurrency(remaining)} remaining before reaching your monthly cap. Cycle resets on the 1st of next month.`}
                </p>
              </div>

              {/* Quick Stat Pill in Hero */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shrink-0 text-right min-w-[200px]">
                <span className="text-xs text-slate-400 block">Utilization Rate</span>
                <span
                  className={`text-3xl font-extrabold font-mono tabular-nums block mt-0.5 ${
                    isOverBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : isApproaching
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {Math.round(utilization)}%
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Calculation: (Current Month Debit ÷ Limit)
                </span>
              </div>
            </div>

            {/* Large Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : isApproaching
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>₹0</span>
                <span>50% (₹{(budgetAmount * 0.5).toLocaleString()})</span>
                <span>Cap: {formatCurrency(budgetAmount)}</span>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-xs text-slate-500 block font-medium">Configured Budget</span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                {formatCurrency(budgetAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Stored via POST /add/budget or /update/budget
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-xs text-slate-500 block font-medium">Current Month Debit</span>
              <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(monthlyDebit)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Calculated via POST /get/monthly/txn
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-xs text-slate-500 block font-medium">Available Headroom</span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  isOverBudget
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isOverBudget ? `Over by ${formatCurrency(monthlyDebit - budgetAmount)}` : formatCurrency(remaining)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {isOverBudget ? 'Threshold exceeded' : 'Remaining spending margin'}
              </p>
            </div>
          </div>

          {/* Stored Budget Documents in Database */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Active Budget Documents ({budgets.length})
              </h3>
              <span className="text-xs text-slate-500">Filtered by username @{activeUsername}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {budgets.map((b, idx) => (
                <div key={b._id || idx} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        Monthly Allowance ({b.username})
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Record ID: {b._id || `BGT-${idx + 1}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(b.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUpdateOpen(true)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={PieIcon}
          title={`No Budget Set for @${activeUsername}`}
          description="Establish a monthly spending budget to track expenses and get alerted before overspending."
          actionLabel="Create Monthly Budget"
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Create and Update Modals */}
      <CreateBudgetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchBudgetData();
          window.dispatchEvent(new CustomEvent('finflow_data_mutated'));
        }}
      />

      <UpdateBudgetModal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        currentAmount={primaryBudget?.amount || 0}
        onSuccess={() => {
          fetchBudgetData();
          window.dispatchEvent(new CustomEvent('finflow_data_mutated'));
        }}
      />
    </div>
  );
};
