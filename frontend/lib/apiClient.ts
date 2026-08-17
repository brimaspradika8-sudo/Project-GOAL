import { API_BASE_URL, DEFAULT_HEADERS } from './api';
import { TOKEN_KEY } from './auth';
import * as SecureStore from './secureStorage';
import { useProfileStore } from '../store/profileStore';
import { router } from 'expo-router';

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  token?: string | null;
  timeout?: number;
  skipToken?: boolean;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(typeof data?.message === 'string' && data.message ? data.message : `Permintaan gagal (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let handling401 = false;

async function handle401() {
  if (handling401) return;
  handling401 = true;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    useProfileStore.getState().clearProfile();
    router.replace('/login');
  } catch {
    // redirect best-effort
  } finally {
    setTimeout(() => { handling401 = false; }, 2000);
  }
}

async function parseJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { params, body, token, timeout = 20000, skipToken, headers, ...rest } = options;

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(path.startsWith('http') ? path : `${base}${path.replace(/^\//, '')}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders: Record<string, string> = { ...DEFAULT_HEADERS, ...headers };
  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  let effectiveToken = token;
  if (!skipToken && effectiveToken === undefined) {
    effectiveToken = await SecureStore.getItemAsync(TOKEN_KEY);
  }
  if (effectiveToken) {
    finalHeaders['Authorization'] = `Bearer ${effectiveToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : typeof body === 'string' || isFormData
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 401 && !url.pathname.includes('/auth/login') && !url.pathname.includes('/auth/register')) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      const { useProfileStore } = require('../store/profileStore');
      useProfileStore.getState().clearProfile();
      if (typeof window !== 'undefined') {
        const { router } = require('expo-router');
        router.replace('/login');
      }
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T = any>(path: string, options?: ApiRequestOptions): Promise<T> {
  const res = await apiFetch(path, options);
  if (res.status === 401) {
    handle401();
  }
  if (!res.ok) {
    throw new ApiError(res.status, await parseJson(res));
  }
  return parseJson(res);
}

export async function apiSend<T = any>(method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', path: string, options?: ApiRequestOptions): Promise<T> {
  const res = await apiFetch(path, { ...options, method });
  if (res.status === 401) {
    handle401();
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}
