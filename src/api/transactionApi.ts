import { apiClient, executeRequest, ServiceResponse } from './axios';
import { mockDatabase } from './mockSimulator';
import { Transaction, CreatePaymentPayload, TransactionStatistics } from '../types';

export const transactionApi = {
  // POST /create/payment - Record transaction and adjust balance
  async createPayment(payload: CreatePaymentPayload): Promise<ServiceResponse<Transaction>> {
    const dataToSend = {
      username: payload.username,
      bankName: payload.bankName,
      type: payload.type,
      transactionAmount: Number(payload.transactionAmount),
      transactionDesc: payload.transactionDesc || '',
      categories: payload.categories || 'general',
      time: payload.time || Date.now(),
    };

    return executeRequest<Transaction>(
      () => apiClient.post('/create/payment', dataToSend),
      () => mockDatabase.createPayment(dataToSend)
    );
  },

  // POST /get/txn - Retrieve transactions matching filter
  async getTransactions(filter: { username?: string }): Promise<ServiceResponse<Transaction[]>> {
    return executeRequest<Transaction[]>(
      () => apiClient.post('/get/txn', filter),
      () => mockDatabase.getTxn(filter)
    );
  },

  // POST /get/txn/statistics - Retrieve transaction statistics
  async getStatistics(filter: { username?: string }): Promise<ServiceResponse<TransactionStatistics>> {
    return executeRequest<TransactionStatistics>(
      () => apiClient.post('/get/txn/statistics', filter),
      () => mockDatabase.getTxnStatistics(filter)
    );
  },

  // POST /get/monthly/txn - Retrieve current month debit total
  async getMonthlyDebit(filter: { username?: string }): Promise<ServiceResponse<number>> {
    return executeRequest<number>(
      () => apiClient.post('/get/monthly/txn', filter),
      () => mockDatabase.getMonthlyTxn(filter)
    );
  },
};
