import { apiClient, executeRequest, ServiceResponse } from './axios';
import { mockDatabase } from './mockSimulator';
import { User, PaymentQRCode, HealthCheckResponse } from '../types';

export const userApi = {
  // GET / - Health Check
  async checkHealth(): Promise<ServiceResponse<HealthCheckResponse>> {
    return executeRequest<HealthCheckResponse>(
      () => apiClient.get('/'),
      () => mockDatabase.healthCheck()
    );
  },

  // POST /create - Create a user document
  async createUser(userData: User): Promise<ServiceResponse<User>> {
    return executeRequest<User>(
      () => apiClient.post('/create', userData),
      () => mockDatabase.createUser(userData)
    );
  },

  // POST /get/account - Look up account by username or mobile
  async getAccount(filter: { username?: string; mobile?: string }): Promise<ServiceResponse<User>> {
    return executeRequest<User>(
      () => apiClient.post('/get/account', filter),
      () => mockDatabase.getAccount(filter) as any
    );
  },

  // POST /get/qr - Generate payment QR codes for user accounts
  async getPaymentQRs(payload: { username: string; Amount?: number }): Promise<ServiceResponse<PaymentQRCode[]>> {
    return executeRequest<PaymentQRCode[]>(
      () => apiClient.post('/get/qr', payload),
      () => mockDatabase.getQr(payload)
    );
  },
};
