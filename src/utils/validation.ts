export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateUserCreation(data: {
  name: string;
  mobile: string;
  email: string;
  username: string;
  accounts: Array<{
    bankName: string;
    number: string;
    balance: number | string;
    type: string;
    vpa: string;
  }>;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Full name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.username?.trim()) {
    errors.username = 'Username is required';
  } else if (!/^[a-zA-Z0-9_.-]+$/.test(data.username.trim())) {
    errors.username = 'Username can only contain letters, numbers, underscores, and dots';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!/^\d{10}$/.test(data.mobile.trim())) {
    errors.mobile = 'Mobile must be a 10-digit number';
  }

  if (!data.accounts || data.accounts.length === 0) {
    errors.accounts = 'At least one account is required';
  } else {
    data.accounts.forEach((acc, idx) => {
      if (!acc.bankName?.trim()) {
        errors[`account_${idx}_bankName`] = 'Bank name is required';
      }
      if (!acc.number?.trim()) {
        errors[`account_${idx}_number`] = 'Account number is required';
      } else if (!/^\d{6,18}$/.test(acc.number.trim())) {
        errors[`account_${idx}_number`] = 'Account number must be 6-18 digits';
      }
      if (acc.balance === '' || isNaN(Number(acc.balance)) || Number(acc.balance) < 0) {
        errors[`account_${idx}_balance`] = 'Valid non-negative balance is required';
      }
      if (!acc.vpa?.trim()) {
        errors[`account_${idx}_vpa`] = 'VPA / UPI ID is required';
      } else if (!/^[\w.-]+@[\w.-]+$/.test(acc.vpa.trim())) {
        errors[`account_${idx}_vpa`] = 'VPA must be in format username@bank';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateTransaction(data: {
  username: string;
  bankName: string;
  type: string;
  transactionAmount: number | string;
  transactionDesc?: string;
  categories?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.username?.trim()) {
    errors.username = 'Username is required';
  }
  if (!data.bankName?.trim()) {
    errors.bankName = 'Bank name is required';
  }
  if (!['debit', 'credit'].includes(data.type)) {
    errors.type = 'Transaction type must be debit or credit';
  }
  const amt = Number(data.transactionAmount);
  if (data.transactionAmount === '' || isNaN(amt) || amt <= 0) {
    errors.transactionAmount = 'Amount must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBudget(data: { username: string; amount: number | string }): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.username?.trim()) {
    errors.username = 'Username is required';
  }
  const amt = Number(data.amount);
  if (data.amount === '' || isNaN(amt) || amt <= 0) {
    errors.amount = 'Budget amount must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
