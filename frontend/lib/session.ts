import { router } from 'expo-router';
import { apiFetch } from './apiClient';
import * as SecureStore from './secureStorage';
import { TOKEN_KEY } from './auth';
import { useProfileStore } from '../store/profileStore';
import { useNotificationStore } from '../store/notificationStore';

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await useProfileStore.getState().clearProfile();
  useNotificationStore.getState().clear();
  router.replace('/login');
}
