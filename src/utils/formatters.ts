export function formatCurrency(amount: number | null | undefined, currency = '₹'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `${currency}0.00`;
  }
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function maskAccountNumber(num: string | null | undefined): string {
  if (!num) return '••••';
  const str = String(num).trim();
  if (str.length <= 4) return `•••• ${str}`;
  const lastFour = str.slice(-4);
  return `•••• •••• ${lastFour}`;
}

export function maskVpa(vpa: string | null | undefined): string {
  if (!vpa) return '—';
  const parts = vpa.split('@');
  if (parts.length < 2) return vpa;
  const username = parts[0];
  const handle = parts[1];
  if (username.length <= 2) return `${username}***@${handle}`;
  return `${username.slice(0, 2)}***${username.slice(-1)}@${handle}`;
}
