import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileBarChart2,
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Download,
  Building2,
  TrendingUp,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useApiConfig } from '../context/ApiConfigContext';
import { useToast } from '../context/ToastContext';
import { transactionApi } from '../api/transactionApi';
import { reportApi } from '../api/reportApi';
import { TransactionStatistics } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';

export const Reports: React.FC = () => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [stats, setStats] = useState<TransactionStatistics | null>(null);
  const [monthlyDebit, setMonthlyDebit] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Email report dispatch modal & loading
  const [isConfirmSendOpen, setIsConfirmSendOpen] = useState<boolean>(false);
  const [sendingReport, setSendingReport] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<any | null>(null);

  const fetchReportData = useCallback(async () => {
    if (!activeUsername) return;
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        transactionApi.getStatistics({ username: activeUsername }),
        transactionApi.getMonthlyDebit({ username: activeUsername }),
      ]);

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
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading analytics',
        message: err.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUsername, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchReportData();
  }, [fetchReportData]);

  // Handle Send 30-Day Email Report
  const handleTriggerEmailReport = async () => {
    setSendingReport(true);
    try {
      const res = await reportApi.sendReport();
      if (res.success) {
        setReportResult(res.data);
        showToast({
          type: 'success',
          title: '30-Day Report Dispatched',
          message: 'The backend generated the 30-day transaction report and queued email delivery.',
        });
        setIsConfirmSendOpen(false);
      } else {
        showToast({
          type: 'error',
          title: 'Report Delivery Failed',
          message: res.message || 'The server could not dispatch the 30-day email report.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err.message,
      });
    } finally {
      setSendingReport(false);
    }
  };

  // Prepare Date-wise data for charts
  const dateWiseChartData = useMemo(() => {
    if (!stats || !stats.date || !stats.dateWise) return [];
    return stats.date.map((dateStr) => {
      const items = stats.dateWise[dateStr] || [];
      const creditAmt = items
        .filter((t) => t.type !== 'debit')
        .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
      const debitAmt = items
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
      return {
        date: dateStr.replace(/^[a-zA-Z]+ /, '').replace(/ \d{4}$/, ''),
        fullDate: dateStr,
        Credit: creditAmt,
        Debit: debitAmt,
      };
    });
  }, [stats]);

  // Aggregate category breakdown for pie chart
  const categoryChartData = useMemo(() => {
    if (!stats || !stats.dateWise) return [];
    const catMap: Record<string, number> = {};
    Object.values(stats.dateWise).forEach((list) => {
      list.forEach((txn) => {
        const cat = (txn.categories || 'general').toLowerCase();
        catMap[cat] = (catMap[cat] || 0) + (txn.transactionAmount || 0);
      });
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
    return Object.entries(catMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [stats]);

  const netCashFlow = (stats?.totalCreditAmount || 0) - (stats?.totalDebitAmount || 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aggregated transaction metrics, date-wise volume, and 30-day email reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchReportData();
            }}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Reload reports"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmSendOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send 30-Day Email Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Credited"
              value={formatCurrency(stats?.totalCreditAmount || 0)}
              subtext={`${stats?.totalCreditCount || 0} Total Deposits`}
              icon={ArrowUpRight}
              variant="credit"
            />
            <StatCard
              label="Total Debited"
              value={formatCurrency(stats?.totalDebitAmount || 0)}
              subtext={`${stats?.totalDebitCount || 0} Total Withdrawals`}
              icon={ArrowDownLeft}
              variant="debit"
            />
            <StatCard
              label="Net Cash Flow"
              value={formatCurrency(netCashFlow)}
              subtext={netCashFlow >= 0 ? 'Positive balance accumulation' : 'Net negative deficit'}
              icon={TrendingUp}
              variant={netCashFlow >= 0 ? 'credit' : 'debit'}
            />
            <StatCard
              label="This Month Debit"
              value={formatCurrency(monthlyDebit)}
              subtext="Aggregated via POST /get/monthly/txn"
              icon={Clock}
              variant="neutral"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date-wise Bar Chart */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Date-Wise Inflow & Outflow
                  </h3>
                  <p className="text-xs text-slate-500">Transaction sums grouped by calendar date</p>
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

              <div className="h-72 w-full">
                {dateWiseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dateWiseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <Bar dataKey="Credit" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Debit" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No date-wise transactions found.
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Spending by Category
                </h3>
                <p className="text-xs text-slate-500 mb-4">Volume distribution across categories</p>

                <div className="h-52 w-full">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
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
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No category data.
                    </div>
                  )}
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {categoryChartData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Date-wise Detailed Breakdown Table */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Date-wise Grouped Records
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct representation of the <code>dateWise</code> dictionary returned by <code>POST /get/txn/statistics</code>
            </p>

            {stats && stats.date && stats.date.length > 0 ? (
              <div className="space-y-4">
                {stats.date.map((dateStr) => {
                  const txns = stats.dateWise[dateStr] || [];
                  const dayCredit = txns
                    .filter((t) => t.type !== 'debit')
                    .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
                  const dayDebit = txns
                    .filter((t) => t.type === 'debit')
                    .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);

                  return (
                    <div
                      key={dateStr}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-750 pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {dateStr}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({txns.length} transaction{txns.length === 1 ? '' : 's'})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(dayCredit)}
                          </span>
                          <span className="text-rose-600 dark:text-rose-400">
                            -{formatCurrency(dayDebit)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {txns.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  t.type === 'debit' ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {t.transactionDesc || (t.type === 'debit' ? 'Debit' : 'Credit')}
                              </span>
                              <span className="text-[11px] text-slate-400 capitalize hidden sm:inline">
                                ({t.categories || 'general'})
                              </span>
                            </div>
                            <span
                              className={`font-mono font-bold whitespace-nowrap ml-2 ${
                                t.type === 'debit'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {t.type === 'debit' ? '-' : '+'}
                              {formatCurrency(t.transactionAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No transaction records available to summarize.
              </p>
            )}
          </div>
        </>
      )}

      {/* Confirmation Modal for Triggering Email Report */}
      <Modal
        isOpen={isConfirmSendOpen}
        onClose={() => setIsConfirmSendOpen(false)}
        title="Confirm 30-Day Email Report Delivery"
        description="Triggering this endpoint will execute GET /send/report/ on the backend."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Sensitive Action Warning</span>
              <span>
                As documented in the API specification, <code>GET /send/report/</code> compiles all users
                and transactions over the last 30 days and delivers them via email. Ensure your backend
                has email credentials configured.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-mono font-bold text-emerald-600">GET</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Endpoint:</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">/send/report/</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timeframe:</span>
              <span>Last 30 Days</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsConfirmSendOpen(false)}
              disabled={sendingReport}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerEmailReport}
              disabled={sendingReport}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {sendingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing & Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Report Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
