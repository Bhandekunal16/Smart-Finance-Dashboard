import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { budgetApi } from '../../api/budgetApi';
import { useApiConfig } from '../../context/ApiConfigContext';
import { useToast } from '../../context/ToastContext';
import { validateBudget } from '../../utils/validation';
import { Loader2, PlusCircle } from 'lucide-react';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateBudget({ username: activeUsername, amount });
    if (!validation.isValid) {
      setError(validation.errors.amount || validation.errors.username || 'Invalid budget');
      return;
    }

    setSubmitting(true);
    try {
      const res = await budgetApi.addBudget({
        username: activeUsername,
        amount: Number(amount),
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Budget Created',
          message: `Monthly budget of ₹${Number(amount).toLocaleString()} established for @${activeUsername}.`,
        });
        setAmount('');
        onSuccess();
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Add Budget',
          message: res.message || 'Server rejected budget document.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Could not communicate with budget API.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Monthly Budget"
      description={`Set an expenditure ceiling for user @${activeUsername}. Utilization will track debit transactions.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Budget Amount (₹) *
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
              placeholder="e.g. 15000"
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
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            <span>Set Budget</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
