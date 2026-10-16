import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { mockDatabase } from './mockSimulator';

// Retrieve default base URL from Vite env or fallback to local backend port 4000
export const DEFAULT_API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';

let currentBaseUrl = localStorage.getItem('finflow_api_base_url') || DEFAULT_API_BASE_URL;
let useSimulationMode = localStorage.getItem('finflow_use_simulation') === 'true';

// Create Central Axios Instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  currentBaseUrl = url.trim().replace(/\/$/, '');
  apiClient.defaults.baseURL = currentBaseUrl;
  localStorage.setItem('finflow_api_base_url', currentBaseUrl);
}

export function isSimulationMode(): boolean {
  return useSimulationMode;
}

export function setSimulationMode(enabled: boolean): void {
  useSimulationMode = enabled;
  localStorage.setItem('finflow_use_simulation', enabled ? 'true' : 'false');
}

/**
 * Normalizes backend responses per api(20261016-094625).md:
 * Handles 200 HTTP codes that contain 409 Conflict, 404 Not Found, or error flags.
 */
export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  statusCode: number;
  raw?: any;
}

export function parseResponse<T>(res: AxiosResponse<ApiResponse<T>>): ServiceResponse<T> {
  const body = res.data;

  // Handle simple healthcheck string or message
  if (body && typeof body === 'object' && 'message' in body && !('statusCode' in body)) {
    return {
      success: true,
      data: (body as any) as T,
      message: (body as any).message || 'OK',
      statusCode: res.status,
      raw: body,
    };
  }

  // Handle standard ApiResponse wrapper: { data, status, statusCode, msg }
  const statusCode = body?.statusCode || res.status || 200;
  const msg = body?.msg || body?.message || '';

  // Check for Conflict / Duplicate case
  if (statusCode === 409 || msg.toLowerCase().includes('conflict')) {
    return {
      success: false,
      data: null,
      message: msg || 'Conflict: Record already exists',
      statusCode: 409,
      raw: body,
    };
  }

  // Check for Not Found
  if (statusCode === 404 || msg.toLowerCase().includes('not found')) {
    return {
      success: false,
      data: null,
      message: msg || 'Requested resource was not found',
      statusCode: 404,
      raw: body,
    };
  }

  // Check if status is explicitly false
  if (body?.status === false) {
    return {
      success: false,
      data: null,
      message: msg || 'Request could not be completed',
      statusCode: statusCode >= 400 ? statusCode : 400,
      raw: body,
    };
  }

  // Successful response
  return {
    success: true,
    data: (body?.data !== undefined ? body.data : (body as unknown as T)) ?? null,
    message: msg || 'Success',
    statusCode: 200,
    raw: body,
  };
}

export function parseError(error: any): ServiceResponse<any> {
  if (error.response) {
    const data = error.response.data;
    const msg = data?.message || data?.msg || error.response.statusText || 'Server error occurred';
    return {
      success: false,
      data: null,
      message: msg,
      statusCode: error.response.status || 500,
      raw: data,
    };
  } else if (error.request) {
    return {
      success: false,
      data: null,
      message: `Unable to connect to backend at ${currentBaseUrl}. Check if server is running and CORS is enabled.`,
      statusCode: 0,
      raw: null,
    };
  }
  return {
    success: false,
    data: null,
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
  };
}

/**
 * Universal router that executes through the real backend API or local mock engine
 */
export async function executeRequest<T>(
  action: () => Promise<AxiosResponse<ApiResponse<T>>>,
  mockAction: () => ApiResponse<T>
): Promise<ServiceResponse<T>> {
  if (useSimulationMode) {
    // Simulated mode with slight delay for realistic UI loading states
    await new Promise((r) => setTimeout(r, 180));
    const mockRes = mockAction();
    return parseResponse({
      data: mockRes,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
  }

  try {
    const res = await action();
    return parseResponse<T>(res);
  } catch (err: any) {
    return parseError(err);
  }
}
