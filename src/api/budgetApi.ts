import { apiClient, executeRequest, ServiceResponse } from './axios';
import { Budget } from '../types';

export const budgetApi = {
  // POST /add/budget - Create budget
  async addBudget(payload: { username: string; amount: number }): Promise<ServiceResponse<Budget>> {
    const dataToSend = {
      username: payload.username,
      amount: Number(payload.amount),
    };
    return executeRequest<Budget>(() => apiClient.post('/add/budget', dataToSend));
  },

  // POST /get/budget - Retrieve budgets
  async getBudgets(filter: { username?: string }): Promise<ServiceResponse<Budget[]>> {
    return executeRequest<Budget[]>(() => apiClient.post('/get/budget', filter));
  },

  // POST /update/budget - Update budget
  async updateBudget(payload: { username: string; amount: number }): Promise<ServiceResponse<any>> {
    const dataToSend = {
      username: payload.username,
      amount: Number(payload.amount),
    };
    return executeRequest<any>(() => apiClient.post('/update/budget', dataToSend));
  },
};
