import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { userApi } from '../../api/userApi';
import { useToast } from '../../context/ToastContext';
import { validateUserCreation } from '../../utils/validation';
import { User, UserAccount } from '../../types';
import { Plus, Trash2, Loader2, UserCheck } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: User) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [accounts, setAccounts] = useState<UserAccount[]>([
    {
      type: 'savings',
      bankName: '',
      number: '',
      balance: 1000,
      vpa: '',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        type: 'savings',
        bankName: '',
        number: '',
        balance: 0,
        vpa: '',
      },
    ]);
  };

  const handleRemoveAccount = (index: number) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAccountChange = (index: number, field: keyof UserAccount, val: any) => {
    setAccounts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = validateUserCreation({
      name,
      username,
      email,
      mobile,
      accounts,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: User = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        mobile: mobile.trim(),
        accounts: accounts.map((a) => ({
          ...a,
          bankName: a.bankName.trim(),
          number: a.number.trim(),
          balance: Number(a.balance) || 0,
          vpa: a.vpa.trim(),
        })),
      };

      const res = await userApi.createUser(payload);

      if (res.success && res.data) {
        showToast({
          type: 'success',
          title: 'User Profile Created',
          message: `User @${res.data.username} registered with ${res.data.accounts.length} linked account(s).`,
        });
        onUserCreated(res.data);
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Registration Rejected',
          message: res.message || 'The user document could not be created.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Failed to submit registration.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User Profile"
      description="Register a new user document on the Express backend with associated bank accounts."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Identity fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Asha Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. asha"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.username && <p className="text-[11px] text-rose-500 mt-0.5">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="asha@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-0.5">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number (10 digits) *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.mobile && <p className="text-[11px] text-rose-500 mt-0.5">{errors.mobile}</p>}
          </div>
        </div>

        {/* Linked Accounts Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Bank Accounts ({accounts.length})
              </span>
              <p className="text-[11px] text-slate-500">
                Link savings, current, or salary accounts to this user profile.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAccount}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Account
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {accounts.map((acc, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Account #{idx + 1}
                  </span>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                      aria-label="Remove account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Bank Name (e.g. Example Bank)"
                      value={acc.bankName}
                      onChange={(e) => handleAccountChange(idx, 'bankName', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    {errors[`account_${idx}_bankName`] && (
                      <p className="text-[10px] text-rose-500 mt-0.5">
                        {errors[`account_${idx}_bankName`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <select
                      value={acc.type}
                      onChange={(e) => handleAccountChange(idx, 'type', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs capitalize focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                      <option value="salary">Salary</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Account Number (e.g. 1234567890)"
                      value={acc.number}
                      onChange={(e) => handleAccountChange(idx, 'number', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                    />
                    {errors[`account_${idx}_number`] && (
                      <p className="text-[10px] text-rose-500 mt-0.5">
                        {errors[`account_${idx}_number`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Initial Balance (₹)"
                      value={acc.balance}
                      onChange={(e) => handleAccountChange(idx, 'balance', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                    />
                    {errors[`account_${idx}_balance`] && (
                      <p className="text-[10px] text-rose-500 mt-0.5">
                        {errors[`account_${idx}_balance`]}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="VPA / UPI ID (e.g. username@bank)"
                      value={acc.vpa}
                      onChange={(e) => handleAccountChange(idx, 'vpa', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                    />
                    {errors[`account_${idx}_vpa`] && (
                      <p className="text-[10px] text-rose-500 mt-0.5">
                        {errors[`account_${idx}_vpa`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
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
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating User...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
