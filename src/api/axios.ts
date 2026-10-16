import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

export const BACKEND_SERVER_URL = 'http://147.224.251.137:8001';

// In browser environment, route through /api backend middleware
export function resolveBaseUrl(): string {
  return '/api';
}

export const DEFAULT_API_BASE_URL = resolveBaseUrl();

// Create Central Axios Instance configured to http://147.224.251.137:8001
export const apiClient: AxiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export function getApiBaseUrl(): string {
  return BACKEND_SERVER_URL;
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
      message: `Unable to connect to backend at ${BACKEND_SERVER_URL}. Check network route or firewall.`,
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
 * Universal router that executes directly against the real backend server
 */
export async function executeRequest<T>(
  action: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<ServiceResponse<T>> {
  try {
    const res = await action();
    return parseResponse<T>(res);
  } catch (err: any) {
    return parseError(err);
  }
}
