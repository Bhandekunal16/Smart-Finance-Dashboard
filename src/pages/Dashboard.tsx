import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart as PieIcon,
  CreditCard,
  PlusCircle,
  QrCode,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Building2,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { MaskedText } from '../components/common/MaskedText';
import { useApiConfig } from '../context/ApiConfigContext';
import { userApi } from '../api/userApi';
import { transactionApi } from '../api/transactionApi';
import { budgetApi } from '../api/budgetApi';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { User, Transaction, Budget, TransactionStatistics } from '../types';

export const Dashboard: React.FC = () => {
  const { activeUsername, baseUrl, isSimulation } = useApiConfig();
  const { openAddTxn } = useOutletContext<{ openAddTxn: () => void }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStatistics | null>(null);
  const [monthlyDebit, setMonthlyDebit] = useState<number>(0);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!activeUsername) return;
    setErrorMsg(null);

    try {
      // Execute API requests matching api documentation
      const [userRes, txnsRes, statsRes, monthlyRes, budgetRes] = await Promise.all([
        userApi.getAccount({ username: activeUsername }),
        transactionApi.getTransactions({ username: activeUsername }),
        transactionApi.getStatistics({ username: activeUsername }),
        transactionApi.getMonthlyDebit({ username: activeUsername }),
        budgetApi.getBudgets({ username: activeUsername }),
      ]);

      if (userRes.success && userRes.data) {
        setUser(userRes.data);
      } else {
        setUser(null);
      }

      if (txnsRes.success && Array.isArray(txnsRes.data)) {
        setRecentTxns(txnsRes.data);
      } else {
        setRecentTxns([]);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(null);
      }

      if (monthlyRes.success && typeof monthlyRes.data === 'number') {
        setMonthlyDebit(monthlyRes.data);
      } else {
        setMonthlyDebit(0);
      }

      if (budgetRes.success && Array.isArray(budgetRes.data) && budgetRes.data.length > 0) {
        setBudget(budgetRes.data[0]);
      } else {
        setBudget(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard data from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUsername]);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Listen for global mutation events
  useEffect(() => {
    const handleMutation = () => {
      fetchDashboardData();
    };
    window.addEventListener('finflow_data_mutated', handleMutation);
    return () => window.removeEventListener('finflow_data_mutated', handleMutation);
  }, [fetchDashboardData]);

  // Aggregate user account balance
  const totalBalance = user?.accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) ?? 0;

  // Calculate budget utilization
  const budgetAmount = budget?.amount || 0;
  const budgetUtilization = budgetAmount > 0 ? (monthlyDebit / budgetAmount) * 100 : 0;
  const budgetRemaining = Math.max(0, budgetAmount - monthlyDebit);

  // Prepare chart series from statistics dateWise
  const chartData = React.useMemo(() => {
    if (!stats || !stats.date || !stats.dateWise) return [];
    return stats.date.map((dateStr) => {
      const items = stats.dateWise[dateStr] || [];
      const credit = items
        .filter((t) => t.type !== 'debit')
        .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
      const debit = items
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
      return {
        date: dateStr.replace(/^[a-zA-Z]+ /, '').replace(/ \d{4}$/, ''), // clean short date
        fullDate: dateStr,
        credit,
        debit,
      };
    });
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardSkeleton />
          </div>
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Empty state if user profile was not found on backend
  if (!user && !loading) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <EmptyState
            icon={Building2}
            title={`No profile found for @${activeUsername}`}
            description={`The backend responded that user "@${activeUsername}" does not exist in the database yet. Create a user profile or switch to another username.`}
            actionLabel="Create User Profile"
            onAction={() => {
              window.location.href = '#/accounts';
            }}
            secondaryActionLabel="Try Demo Mode"
            onSecondaryAction={() => {
              window.location.href = '#/settings';
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome back, {user?.name || activeUsername}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time financial status across {user?.accounts?.length || 0} connected account(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchDashboardData();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/qr"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Receive Payment</span>
          </Link>

          <button
            type="button"
            onClick={openAddTxn}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          subtext={`${user?.accounts?.length || 0} Active Account(s)`}
          icon={Wallet}
          variant="highlight"
        />
        <StatCard
          label="Total Credited"
          value={formatCurrency(stats?.totalCreditAmount || 0)}
          subtext={`${stats?.totalCreditCount || 0} Deposits`}
          icon={ArrowUpRight}
          variant="credit"
        />
        <StatCard
          label="Total Debited"
          value={formatCurrency(stats?.totalDebitAmount || 0)}
          subtext={`${stats?.totalDebitCount || 0} Withdrawals`}
          icon={ArrowDownLeft}
          variant="debit"
        />
        <StatCard
          label="This Month Debit"
          value={formatCurrency(monthlyDebit)}
          subtext={
            budgetAmount > 0
              ? `${Math.round(budgetUtilization)}% of ₹${budgetAmount.toLocaleString()} Budget`
              : 'No budget active'
          }
          icon={PieIcon}
          variant={budgetUtilization > 90 ? 'debit' : 'neutral'}
        />
      </div>

      {/* Budget Utilization Warning Banner if approaching or exceeding */}
      {budget && budgetAmount > 0 && budgetUtilization >= 80 && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            budgetUtilization >= 100
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              budgetUtilization >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          />
          <div className="flex-1 text-xs">
            <span className="font-bold text-sm block mb-0.5">
              {budgetUtilization >= 100
                ? 'Monthly Budget Exceeded!'
                : 'Approaching Monthly Budget Limit'}
            </span>
            <span>
              You have spent {formatCurrency(monthlyDebit)} of your {formatCurrency(budgetAmount)} ceiling
              ({Math.round(budgetUtilization)}%).{' '}
              {budgetUtilization >= 100
                ? `You are over budget by ${formatCurrency(monthlyDebit - budgetAmount)}.`
                : `${formatCurrency(budgetRemaining)} remaining this month.`}
            </span>
          </div>
          <Link
            to="/budgets"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-current shadow-xs whitespace-nowrap shrink-0 hover:opacity-90"
          >
            Adjust Budget
          </Link>
        </div>
      )}

      {/* Charts & Budget Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cashflow Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Income vs Expense Flow
              </h2>
              <p className="text-xs text-slate-500">Date-wise transaction activity from API</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Credit
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Debit
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="credit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCredit)"
                  />
                  <Area
                    type="monotone"
                    dataKey="debit"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDebit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No date-wise transactions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Budget Utilization Meter */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Monthly Budget
              </h2>
              <Link to="/budgets" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Manage
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">Current month debit utilization</p>

            {budget ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1 text-xs">
                    <span className="text-slate-500">Spent:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(monthlyDebit)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2 text-xs">
                    <span className="text-slate-500">Budget Limit:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(budgetAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        budgetUtilization > 100
                          ? 'bg-rose-500'
                          : budgetUtilization > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                    <span>{Math.round(budgetUtilization)}% utilized</span>
                    <span>Remaining: {formatCurrency(budgetRemaining)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Active Plan:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Monthly Cap</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Status:</span>
                    <span
                      className={`font-semibold ${
                        budgetUtilization > 100
                          ? 'text-rose-500'
                          : budgetUtilization > 80
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {budgetUtilization > 100
                        ? 'Exceeded'
                        : budgetUtilization > 80
                        ? 'Warning'
                        : 'On Track'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <PieIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">No budget configured yet.</p>
                <Link
                  to="/budgets"
                  className="inline-block px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Create Monthly Budget
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Billing cycle:</span>
            <span>Monthly (Calendar)</span>
          </div>
        </div>
      </div>

      {/* Linked Accounts & Recent Transactions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linked Accounts Carousel / List */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Linked Bank Accounts
            </h2>
            <Link
              to="/accounts"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {user?.accounts && user.accounts.length > 0 ? (
              user.accounts.map((acc, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {acc.bankName}
                    </span>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      {acc.type}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Account No:</span>
                    <MaskedText value={acc.number} type="account" className="text-xs text-slate-700 dark:text-slate-300" />
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60 dark:border-slate-750">
                    <span className="text-xs text-slate-500">Balance:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50 font-mono tabular-nums">
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No accounts linked yet.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Transactions
                </h2>
                <p className="text-xs text-slate-500">Latest activity sorted by timestamp</p>
              </div>
              <Link
                to="/transactions"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Full History →
              </Link>
            </div>

            {recentTxns.length > 0 ? (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="pb-2.5">Description</th>
                      <th className="pb-2.5">Bank</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {recentTxns.slice(0, 5).map((txn, idx) => {
                      const isDebit = txn.type === 'debit';
                      return (
                        <tr key={txn._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isDebit
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                }`}
                              >
                                {isDebit ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                                  {txn.transactionDesc || (isDebit ? 'Debit' : 'Credit')}
                                </span>
                                <span className="text-[11px] text-slate-400 capitalize block">
                                  {txn.categories || 'general'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {txn.bankName}
                          </td>
                          <td className="py-3 text-slate-500 whitespace-nowrap">
                            {formatDate(txn.time)}
                          </td>
                          <td className="py-3 text-right whitespace-nowrap">
                            <span
                              className={`font-bold font-mono tabular-nums ${
                                isDebit
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isDebit ? '-' : '+'}
                              {formatCurrency(txn.transactionAmount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={CreditCard}
                title="No Transactions Yet"
                description="Record your first debit or credit transaction to see balance shifts and statistics."
                actionLabel="Record Transaction"
                onAction={openAddTxn}
              />
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent 5 items</span>
            <Link to="/transactions" className="hover:text-slate-800 dark:hover:text-slate-200">
              View all {recentTxns.length} records
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
