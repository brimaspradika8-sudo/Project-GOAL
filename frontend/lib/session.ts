import { router } from 'expo-router';
import { apiFetch } from './apiClient';
import * as SecureStore from './secureStorage';
import { TOKEN_KEY } from './auth';
import { useProfileStore } from '../store/profileStore';
import { useNotificationStore } from '../store/notificationStore';
import { useBookingStore } from '../store/bookingStore';
import { useFieldStore } from '../store/fieldStore';
import { useFavoriteStore } from '../store/favoriteStore';

export async function resetAllStores(): Promise<void> {
  await useProfileStore.getState().clearProfile();
  useNotificationStore.getState().clear();
  useBookingStore.setState({ loading: false, error: null });
  useFavoriteStore.getState().clear();
  useFieldStore.setState({ fields: [], meta: null, loading: false, loadingMore: false, error: null });
  await useFieldStore.getState().clearCache();
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await resetAllStores();
  router.replace('/login');
}
