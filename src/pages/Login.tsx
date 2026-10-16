import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Server,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useToast } from '../context/ToastContext';
import { CreateUserModal } from '../components/accounts/CreateUserModal';

export const Login: React.FC = () => {
  const { login, activeUsername, isAuthenticated, logout, baseUrl, isSimulation, setSimulation } =
    useApiConfig();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'username' | 'mobile'>('username');
  const [identifier, setIdentifier] = useState<string>('asha');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);

    const isMobile = mode === 'mobile';
    const result = await login(identifier, isMobile);

    setLoading(false);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: result.message,
      });
      navigate('/');
    } else {
      setError(result.message);
      showToast({
        type: 'error',
        title: 'Sign In Failed',
        message: result.message,
      });
    }
  };

  const handleQuickLogin = async (userToLogin: string) => {
    setIdentifier(userToLogin);
    setMode('username');
    setLoading(true);
    setError(null);

    const result = await login(userToLogin, false);
    setLoading(false);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Logged In as Demo User',
        message: result.message,
      });
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Sign In to FinFlow
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your financial dashboard via your Express API account
          </p>
        </div>

        {/* Auth Box */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          {/* Currently logged-in status banner */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Active session: <strong>@{activeUsername}</strong>
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs underline font-semibold hover:text-emerald-950 dark:hover:text-white"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Login Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sign In Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('username');
                  if (identifier === '9876543210') setIdentifier('asha');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'username'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Username
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('mobile');
                  if (identifier === 'asha') setIdentifier('9876543210');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Mobile Number
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {mode === 'username' ? 'Username' : 'Mobile Number (10 digits)'} *
              </label>
              <div className="relative">
                {mode === 'username' ? (
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={mode === 'username' ? 'text' : 'tel'}
                  required
                  placeholder={mode === 'username' ? 'e.g. asha' : 'e.g. 9876543210'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Queries backend <code>POST /get/account</code> for user records.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{error}</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSimulation(true);
                        handleQuickLogin('asha');
                      }}
                      className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline"
                    >
                      Enable Demo Mode & Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sign In Box */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick One-Click Demo Account
            </span>
            <button
              type="button"
              onClick={() => handleQuickLogin('asha')}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                  AP
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Asha Patel (@asha)
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Default profile from api(20261016-094625).md
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Continue →
              </span>
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Don't have an account yet? </span>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create New Profile
            </button>
          </div>
        </div>

        {/* Backend Endpoint Info */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-850 text-xs text-slate-500 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Server className="w-3.5 h-3.5" />
            <span>Target Backend: {isSimulation ? 'In-Memory Simulator' : baseUrl}</span>
          </div>
          <p className="text-[11px]">
            Configure API endpoint in{' '}
            <Link to="/settings" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              API Settings
            </Link>
          </p>
        </div>
      </div>

      {/* User Registration Modal */}
      <CreateUserModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onUserCreated={(newUser) => {
          login(newUser.username, false);
          navigate('/');
        }}
      />
    </div>
  );
};
