import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApiConfig } from '../../context/ApiConfigContext';
import { useToast } from '../../context/ToastContext';
import { transactionApi } from '../../api/transactionApi';
import { userApi } from '../../api/userApi';
import { validateTransaction } from '../../utils/validation';
import { UserAccount } from '../../types';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBank?: string;
}

const CATEGORIES = [
  'food',
  'groceries',
  'shopping',
  'bills',
  'salary',
  'transfer',
  'entertainment',
  'medical',
  'travel',
  'investment',
  'general',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultBank,
}) => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [category, setCategory] = useState<string>('food');
  const [dateString, setDateString] = useState<string>(() =>
    new Date().toISOString().substring(0, 10)
  );

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && activeUsername) {
      setLoadingAccounts(true);
      userApi
        .getAccount({ username: activeUsername })
        .then((res) => {
          if (res.success && res.data?.accounts && res.data.accounts.length > 0) {
            setUserAccounts(res.data.accounts);
            if (defaultBank) {
              setBankName(defaultBank);
            } else if (!bankName) {
              setBankName(res.data.accounts[0].bankName);
            }
          }
        })
        .finally(() => setLoadingAccounts(false));
    }
  }, [isOpen, activeUsername, defaultBank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = validateTransaction({
      username: activeUsername,
      bankName,
      type,
      transactionAmount: amount,
      transactionDesc: desc,
      categories: category,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const parsedTime = dateString ? new Date(dateString).getTime() : Date.now();
      const res = await transactionApi.createPayment({
        username: activeUsername,
        bankName: bankName.trim(),
        type,
        transactionAmount: Number(amount),
        transactionDesc: desc.trim() || (type === 'debit' ? 'Expense' : 'Income Deposit'),
        categories: category,
        time: parsedTime,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Transaction Recorded',
          message: `Successfully created ${type} of ₹${Number(amount).toFixed(2)} on ${bankName}. Account balance adjusted.`,
        });
        // Reset form
        setAmount('');
        setDesc('');
        onSuccess?.();
      } else {
        showToast({
          type: 'error',
          title: 'Transaction Failed',
          message: res.message || 'The server rejected this transaction request.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Failed to submit payment transaction.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Transaction"
      description={`Post a credit or debit transaction against user @${activeUsername}. Balance will be automatically recalculated by the API.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Segmented Switcher */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('debit')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'debit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Debit (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType('credit')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'credit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Credit (Income)
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Amount (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {errors.transactionAmount && (
            <p className="text-xs text-rose-500 mt-1">{errors.transactionAmount}</p>
          )}
        </div>

        {/* Bank Name Selector / Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Target Bank Name *
          </label>
          {userAccounts.length > 0 ? (
            <div className="space-y-1.5">
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {userAccounts.map((acc, i) => (
                  <option key={i} value={acc.bankName}>
                    {acc.bankName} ({acc.type}) — Bal: ₹{acc.balance.toLocaleString()}
                  </option>
                ))}
                <option value="__custom__">+ Enter different bank name</option>
              </select>
              {bankName === '__custom__' && (
                <input
                  type="text"
                  placeholder="Enter custom bank name"
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ) : (
            <input
              type="text"
              required
              placeholder="e.g. Example Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {errors.bankName && <p className="text-xs text-rose-500 mt-1">{errors.bankName}</p>}
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Groceries at Supermarket"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Record Payment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
