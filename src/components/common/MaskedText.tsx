import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApiConfig } from '../../context/ApiConfigContext';

interface MaskedTextProps {
  value: string;
  type?: 'account' | 'vpa' | 'text';
  className?: string;
}

export const MaskedText: React.FC<MaskedTextProps> = ({ value, type = 'account', className = '' }) => {
  const { isMasked: globalMasked } = useApiConfig();
  const [localUnmask, setLocalUnmask] = useState(false);

  const shouldMask = globalMasked && !localUnmask;

  const renderMaskedValue = () => {
    if (!value) return '—';
    if (!shouldMask) return value;

    if (type === 'account') {
      const str = String(value).trim();
      const lastFour = str.slice(-4);
      return `•••• •••• ${lastFour}`;
    }

    if (type === 'vpa') {
      const parts = value.split('@');
      if (parts.length < 2) return '••••';
      const user = parts[0];
      const host = parts[1];
      return `${user.slice(0, 2)}•••@${host}`;
    }

    return '••••••••';
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${className}`}>
      <span>{renderMaskedValue()}</span>
      <button
        type="button"
        onClick={() => setLocalUnmask((prev) => !prev)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
        title={shouldMask ? 'Reveal account details' : 'Mask account details'}
        aria-label={shouldMask ? 'Reveal details' : 'Mask details'}
      >
        {shouldMask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
};
