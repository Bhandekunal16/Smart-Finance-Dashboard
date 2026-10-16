import { apiClient, executeRequest, ServiceResponse } from './axios';

export const reportApi = {
  // GET /send/report/ - Trigger 30-day report generation and email dispatch
  async sendReport(): Promise<ServiceResponse<any>> {
    return executeRequest<any>(() => apiClient.get('/send/report/'));
  },
};
