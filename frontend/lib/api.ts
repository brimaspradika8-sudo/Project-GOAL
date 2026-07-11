import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;
const API_PATH = '/api';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getExpoHost() {
  const constants = Constants as any;
  const hostUri =
    Constants.expoConfig?.hostUri ??
    constants.manifest?.debuggerHost ??
    constants.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri || typeof hostUri !== 'string') return null;

  return hostUri.split(':')[0];
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}${API_PATH}`;
  }

  const expoHost = getExpoHost();

  if (expoHost) {
    return `http://${expoHost}:${API_PORT}${API_PATH}`;
  }

  return `http://localhost:${API_PORT}${API_PATH}`;
}

export const API_BASE_URL = getApiBaseUrl();
