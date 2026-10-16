import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  PlusCircle,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  X,
  CreditCard,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useToast } from '../context/ToastContext';
import { transactionApi } from '../api/transactionApi';
import { userApi } from '../api/userApi';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';

export const Transactions: React.FC = () => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7days' | '30days' | 'thisMonth'>('all');

  const fetchTransactions = useCallback(async () => {
    if (!activeUsername) return;
    try {
      const res = await transactionApi.getTransactions({ username: activeUsername });
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to fetch transactions',
        message: err.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUsername, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions();
  }, [fetchTransactions]);

  // Extract unique banks and categories for filter dropdowns
  const availableBanks = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.bankName) set.add(t.bankName);
    });
    return Array.from(set);
  }, [transactions]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.categories) set.add(t.categories);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions logic
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    return transactions.filter((txn) => {
      // Type filter
      if (typeFilter !== 'all' && txn.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && txn.categories?.toLowerCase() !== categoryFilter.toLowerCase())
        return false;

      // Bank filter
      if (bankFilter !== 'all' && txn.bankName?.toLowerCase() !== bankFilter.toLowerCase())
        return false;

      // Date range filter
      if (dateRangeFilter === '7days') {
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        if ((txn.time || 0) < sevenDaysAgo) return false;
      } else if (dateRangeFilter === '30days') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        if ((txn.time || 0) < thirtyDaysAgo) return false;
      } else if (dateRangeFilter === 'thisMonth') {
        if ((txn.time || 0) < startOfCurrentMonth) return false;
      }

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDesc = (txn.transactionDesc || '').toLowerCase().includes(q);
        const matchesBank = (txn.bankName || '').toLowerCase().includes(q);
        const matchesCat = (txn.categories || '').toLowerCase().includes(q);
        const matchesAmt = String(txn.transactionAmount || '').includes(q);
        if (!matchesDesc && !matchesBank && !matchesCat && !matchesAmt) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, bankFilter, dateRangeFilter, search]);

  // Total debited and credited in filtered view
  const filteredTotals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'debit') {
        debit += t.transactionAmount || 0;
      } else {
        credit += t.transactionAmount || 0;
      }
    });
    return { credit, debit, net: credit - debit };
  }, [filteredTransactions]);

  const exportCsv = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['ID', 'Date', 'Type', 'Bank', 'Category', 'Description', 'Amount'];
    const rows = filteredTransactions.map((t) => [
      t._id || '',
      new Date(t.time).toISOString(),
      t.type,
      `"${t.bankName || ''}"`,
      `"${t.categories || ''}"`,
      `"${(t.transactionDesc || '').replace(/"/g, '""')}"`,
      t.transactionAmount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${activeUsername}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'info',
      title: 'CSV Exported',
      message: `Exported ${filteredTransactions.length} transactions.`,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setBankFilter('all');
    setDateRangeFilter('all');
  };

  const hasActiveFilters =
    search !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    bankFilter !== 'all' ||
    dateRangeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Page Title & Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete transaction record for @{activeUsername} sorted by latest timestamp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchTransactions();
            }}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Reload transactions"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, bank, category, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Type Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('debit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'debit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Debit Only
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('credit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'credit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Credit Only
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Bank Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Banks</option>
              {availableBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs capitalize focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Date Range:</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">Lifetime</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Calendar Month</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
        <span>
          Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
        </span>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-emerald-600 dark:text-emerald-400">
            +Credit: {formatCurrency(filteredTotals.credit)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-rose-600 dark:text-rose-400">
            -Debit: {formatCurrency(filteredTotals.debit)}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Transaction / Description</th>
                  <th className="py-3 px-4">Bank Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTransactions.map((txn, idx) => {
                  const isDebit = txn.type === 'debit';
                  return (
                    <tr
                      key={txn._id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isDebit
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}
                          >
                            {isDebit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {txn.transactionDesc || (isDebit ? 'Expense Debit' : 'Credit Deposit')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              ID: {txn._id?.slice(-8) || `TXN-${idx + 1}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{txn.bankName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-400 capitalize font-medium">
                          {txn.categories || 'general'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                        {formatDateTime(txn.time)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold tabular-nums">
                        <span
                          className={
                            isDebit
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {isDebit ? '-' : '+'}
                          {formatCurrency(txn.transactionAmount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(txn);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Details
                        </button>
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
            title={hasActiveFilters ? 'No Matching Transactions' : 'No Transactions Recorded'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria or resetting filters.'
                : `User @${activeUsername} has no transactions in the ledger.`
            }
            actionLabel={hasActiveFilters ? 'Reset Filters' : 'Record First Payment'}
            onAction={hasActiveFilters ? clearFilters : () => setIsAddOpen(true)}
          />
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title="Transaction Receipt & Audit"
          description={`Full metadata returned for transaction by @${selectedTxn.username}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Amount Banner */}
            <div
              className={`p-4 rounded-xl flex items-center justify-between ${
                selectedTxn.type === 'debit'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  {selectedTxn.type === 'debit' ? 'Total Debit Amount' : 'Total Credit Amount'}
                </span>
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    selectedTxn.type === 'debit'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {selectedTxn.type === 'debit' ? '-' : '+'}
                  {formatCurrency(selectedTxn.transactionAmount)}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-xl ${
                  selectedTxn.type === 'debit'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700'
                }`}
              >
                {selectedTxn.type === 'debit' ? (
                  <ArrowDownLeft className="w-6 h-6" />
                ) : (
                  <ArrowUpRight className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Key-Value Details Grid */}
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Description:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-right max-w-[60%]">
                  {selectedTxn.transactionDesc || '—'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Bank Associated:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedTxn.bankName}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {selectedTxn.categories || 'general'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {formatDateTime(selectedTxn.time)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Unix Milliseconds:</span>
                <span className="font-mono text-slate-500">{selectedTxn.time}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500">Document Username:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  @{selectedTxn.username}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg hover:bg-slate-800"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          fetchTransactions();
          window.dispatchEvent(new CustomEvent('finflow_data_mutated'));
        }}
      />
    </div>
  );
};
