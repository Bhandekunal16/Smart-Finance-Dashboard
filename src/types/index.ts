/**
 * Data contracts and response types matching api(20261016-094625).md
 */

export interface UserAccount {
  type: 'savings' | 'current' | 'salary' | 'investment' | string;
  bankName: string;
  number: string;
  balance: number;
  vpa: string;
}

export interface User {
  name: string;
  mobile: string;
  email: string;
  username: string;
  accounts: UserAccount[];
}

export interface Transaction {
  _id?: string;
  username: string;
  bankName: string;
  type: 'debit' | 'credit';
  transactionAmount: number;
  transactionDesc?: string;
  categories?: string;
  time: number; // millisecond timestamp
}

export interface CreatePaymentPayload {
  username: string;
  bankName: string;
  type: 'debit' | 'credit';
  transactionAmount: number;
  transactionDesc?: string;
  categories?: string;
  time?: number;
}

export interface Budget {
  _id?: string;
  username: string;
  amount: number;
}

export interface TransactionStatistics {
  totalCreditCount: number;
  totalDebitCount: number;
  totalCreditAmount: number;
  totalDebitAmount: number;
  date: string[];
  dateWise: Record<string, Transaction[]>;
}

export interface PaymentQRCode {
  url: string; // data URL: data:image/png;base64,...
  vpa: string;
  bankName: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  status?: boolean;
  statusCode?: number;
  msg?: string;
  message?: string;
}

export interface HealthCheckResponse {
  message?: string;
  status?: string;
}
