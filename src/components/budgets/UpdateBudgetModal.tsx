import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { budgetApi } from '../../api/budgetApi';
import { useApiConfig } from '../../context/ApiConfigContext';
import { useToast } from '../../context/ToastContext';
import { validateBudget } from '../../utils/validation';
import { Loader2, RefreshCw } from 'lucide-react';

interface UpdateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentAmount: number;
}

export const UpdateBudgetModal: React.FC<UpdateBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentAmount,
}) => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount(String(currentAmount || ''));
      setError('');
    }
  }, [isOpen, currentAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateBudget({ username: activeUsername, amount });
    if (!validation.isValid) {
      setError(validation.errors.amount || 'Invalid amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await budgetApi.updateBudget({
        username: activeUsername,
        amount: Number(amount),
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Budget Updated',
          message: `Budget updated to ₹${Number(amount).toLocaleString()} for @${activeUsername}.`,
        });
        onSuccess();
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: res.message || 'Could not update budget document.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Failed to update budget.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Budget Amount"
      description={`Modify the expenditure ceiling for user @${activeUsername}.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Budget Amount (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
              ₹
            </span>
            <input
              type="number"
              step="100"
              min="1"
              required
              placeholder="e.g. 20000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-base tabular-nums focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
        </div>

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
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Update Budget</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
