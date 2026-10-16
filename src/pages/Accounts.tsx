import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  Building2,
  Plus,
  Search,
  QrCode,
  ShieldCheck,
  CreditCard,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/userApi';
import { User, UserAccount } from '../types';
import { formatCurrency, maskAccountNumber } from '../utils/formatters';
import { MaskedText } from '../components/common/MaskedText';
import { CreateUserModal } from '../components/accounts/CreateUserModal';
import { EmptyState } from '../components/common/EmptyState';

export const Accounts: React.FC = () => {
  const { activeUsername, setActiveUsername } = useApiConfig();
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Search by username or mobile
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<'username' | 'mobile'>('username');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<string | null>(null);

  const fetchUserData = async (usernameToFetch: string) => {
    setLoading(true);
    try {
      const res = await userApi.getAccount({ username: usernameToFetch });
      if (res.success && res.data) {
        setCurrentUser(res.data);
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Fetching Profile',
        message: err.message,
      });
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUsername) {
      fetchUserData(activeUsername);
    }
  }, [activeUsername]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const payload =
        searchType === 'username'
          ? { username: searchQuery.trim().toLowerCase() }
          : { mobile: searchQuery.trim() };

      const res = await userApi.getAccount(payload);

      if (res.success && res.data) {
        setCurrentUser(res.data);
        setActiveUsername(res.data.username);
        showToast({
          type: 'success',
          title: 'Account Found',
          message: `Loaded profile for @${res.data.username}.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'User Not Found',
          message: `No account matches the ${searchType} "${searchQuery}".`,
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Search Failed',
        message: err.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVpa(text);
    showToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: text,
    });
    setTimeout(() => setCopiedVpa(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Accounts & Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage user identity, account types, balances, and payment handles (VPAs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchUserData(activeUsername)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Reload profile"
            aria-label="Reload profile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Account Lookup Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Lookup User by:
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSearchType('username')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  searchType === 'username'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Username
              </button>
              <button
                type="button"
                onClick={() => setSearchType('mobile')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  searchType === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Mobile Number
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                searchType === 'username'
                  ? 'Enter exact username (e.g. asha)'
                  : 'Enter 10-digit mobile (e.g. 9876543210)'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup</span>
          </button>
        </form>
      </div>

      {/* User Information Display */}
      {currentUser ? (
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md uppercase">
                  {currentUser.name ? currentUser.name.slice(0, 2) : currentUser.username.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {currentUser.name}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                      @{currentUser.username}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {currentUser.email}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5" />
                      +91 {currentUser.mobile}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/qr"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>View Payment QRs</span>
                </Link>
              </div>
            </div>

            {/* Quick Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block">Total Linked Accounts</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {currentUser.accounts?.length || 0} Accounts
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Net Liquidity</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 block">
                  {formatCurrency(
                    currentUser.accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0
                  )}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block">Backend Document ID</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5 block truncate">
                  Valid Document
                </span>
              </div>
            </div>
          </div>

          {/* Accounts Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Connected Bank Accounts ({currentUser.accounts?.length || 0})
              </h3>
              <span className="text-xs text-slate-500">
                Data synced via Express POST /get/account
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser.accounts && currentUser.accounts.length > 0 ? (
                currentUser.accounts.map((acc, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {acc.bankName}
                          </h4>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            {acc.type} Account
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Available Balance</span>
                        <span className="text-base font-bold text-slate-900 dark:text-slate-50 font-mono tabular-nums">
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Account Number:</span>
                        <MaskedText value={acc.number} type="account" className="text-slate-800 dark:text-slate-200 font-mono" />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">VPA / UPI ID:</span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                          <span>{acc.vpa}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(acc.vpa)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                            title="Copy VPA"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Active & Verified
                      </span>

                      <Link
                        to="/qr"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Get QR</span>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2">
                  <EmptyState
                    icon={CreditCard}
                    title="No Accounts Attached"
                    description="This user document does not have any bank accounts listed."
                    actionLabel="Add User With Accounts"
                    onAction={() => setIsCreateOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={UserIcon}
          title={`No User Loaded for @${activeUsername}`}
          description="We couldn't retrieve this user from the backend database. You can create a new user with bank accounts or lookup an existing username."
          actionLabel="Create User Now"
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onUserCreated={(newUser) => {
          setCurrentUser(newUser);
          setActiveUsername(newUser.username);
        }}
      />
    </div>
  );
};
