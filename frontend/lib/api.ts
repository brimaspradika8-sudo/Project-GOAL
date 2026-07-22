import Constants from 'expo-constants';
import { Platform } from 'react-native';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getExpoHost(): string | null {
  const constants = Constants as any;
  const hostUri =
    Constants.expoConfig?.hostUri ??
    constants.manifest?.debuggerHost ??
    constants.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri || typeof hostUri !== 'string') return null;

  return hostUri.split(':')[0];
}

function isLocalDevelopmentUrl(value: string): boolean {
  return /^(http:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)(:\d+)?/i.test(value);
}

function extractHostFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

export function getApiBaseUrl() {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }

  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl && !isLocalDevelopmentUrl(configuredUrl)) {
    return trimTrailingSlash(configuredUrl);
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:8000/api`;
  }

  return 'http://localhost:8000/api';
}

export const API_BASE_URL = getApiBaseUrl();

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

