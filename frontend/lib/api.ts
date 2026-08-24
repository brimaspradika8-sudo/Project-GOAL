import { Platform } from 'react-native';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL belum dikonfigurasi. Backend GOAL wajib menggunakan IP WSL.'
    );
  }

  const baseUrl = trimTrailingSlash(configuredUrl);

  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

export const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  ...(API_BASE_URL.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}),
};

export function getErrorMessage(data: any, fallbackMessage: string = 'Terjadi kesalahan.'): string {
  if (data?.errors && typeof data.errors === 'object') {
    const errorList = Object.values(data.errors).flat().filter(Boolean);
    if (errorList.length > 0) {
      return errorList.join('. ');
    }
  }

  if (typeof data?.message === 'string' && data.message.trim() && data.message !== 'Validasi gagal.') {
    return data.message;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return fallbackMessage;
}

export function getResponseData<T = any>(payload: any): T {
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T;
}

export function getAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If it starts with file:// or data: then it's a local/temporary uri
  if (url.startsWith('file://') || url.startsWith('data:')) {
    return url;
  }

  if (/^(http:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)(:\d+)?/i.test(url)) {
    const apiBase = getApiBaseUrl();
    let apiHost: string | null = null;
    try {
      apiHost = new URL(apiBase).hostname;
    } catch {
      apiHost = null;
    }
    if (apiHost) {
      try {
        const parsed = new URL(url);
        parsed.hostname = apiHost;
        return parsed.toString();
      } catch {
        return url.replace(/localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2/g, apiHost);
      }
    }
  }
  return url;
}
