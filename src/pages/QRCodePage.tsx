import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Building2,
  RefreshCw,
  Share2,
  Check,
  AlertCircle,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useApiConfig } from '../context/ApiConfigContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/userApi';
import { PaymentQRCode } from '../types';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';

export const QRCodePage: React.FC = () => {
  const { activeUsername } = useApiConfig();
  const { showToast } = useToast();

  const [qrCodes, setQrCodes] = useState<PaymentQRCode[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<string | null>(null);

  const fetchQRCodes = useCallback(
    async (optionalAmount?: number) => {
      if (!activeUsername) return;
      setGenerating(true);
      try {
        const payload: { username: string; Amount?: number } = { username: activeUsername };
        if (optionalAmount && optionalAmount > 0) {
          payload.Amount = optionalAmount;
        }

        const res = await userApi.getPaymentQRs(payload);
        if (res.success && Array.isArray(res.data)) {
          setQrCodes(res.data);
        } else {
          setQrCodes([]);
        }
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'QR Generation Error',
          message: err.message,
        });
        setQrCodes([]);
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    },
    [activeUsername, showToast]
  );

  useEffect(() => {
    setLoading(true);
    fetchQRCodes();
  }, [fetchQRCodes]);

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = amount ? parseFloat(amount) : undefined;
    fetchQRCodes(parsed);
  };

  const handleDownload = (qr: PaymentQRCode) => {
    const link = document.createElement('a');
    link.href = qr.url;
    link.download = `payment-qr-${qr.bankName.toLowerCase().replace(/\s+/g, '-')}-${activeUsername}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'info',
      title: 'Download Triggered',
      message: `Downloaded payment QR code for ${qr.bankName}.`,
    });
  };

  const handleCopyVpa = (vpa: string) => {
    navigator.clipboard.writeText(vpa);
    setCopiedVpa(vpa);
    showToast({
      type: 'info',
      title: 'VPA Copied',
      message: `Payment address ${vpa} copied to clipboard.`,
    });
    setTimeout(() => setCopiedVpa(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Payment QR Codes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            UPI QR codes generated for every account on @{activeUsername}'s profile
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchQRCodes(amount ? parseFloat(amount) : undefined)}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          <span>Regenerate QRs</span>
        </button>
      </div>

      {/* Amount Parameter Customizer Box */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <form onSubmit={handleAmountSubmit} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specify Requested Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Leave blank for any amount or enter specific sum"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Backend payload field <code>Amount</code> embeds dynamic payment request into UPI QR links.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {amount && (
              <button
                type="button"
                onClick={() => {
                  setAmount('');
                  fetchQRCodes(undefined);
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={generating}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              {generating ? 'Generating...' : 'Update QR Codes'}
            </button>
          </div>
        </form>
      </div>

      {/* QR Codes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : qrCodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              {/* Bank Header */}
              <div className="w-full pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {qr.bankName}
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Account QR #{idx + 1}
                    </span>
                  </div>
                </div>
                {amount && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(Number(amount))}
                  </span>
                )}
              </div>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                <img
                  src={qr.url}
                  alt={`Payment QR code for ${qr.bankName}`}
                  className="w-48 h-48 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* VPA Details */}
              <div className="w-full space-y-1">
                <span className="text-[11px] text-slate-400">Virtual Payment Address (VPA)</span>
                <div className="flex items-center justify-center gap-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-750">
                  <span className="truncate">{qr.vpa}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyVpa(qr.vpa)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
                    title="Copy VPA"
                  >
                    {copiedVpa === qr.vpa ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions: Download & Share */}
              <div className="w-full pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(qr)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyVpa(qr.vpa)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Copy UPI address"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={QrCode}
          title="No QR Codes Available"
          description={`User @${activeUsername} has no registered bank accounts to generate QR codes for.`}
          actionLabel="Add Bank Accounts"
          onAction={() => {
            window.location.href = '#/accounts';
          }}
        />
      )}
    </div>
  );
};
