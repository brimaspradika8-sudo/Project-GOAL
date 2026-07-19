import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../lib/api';
import { TOKEN_KEY } from '../app/_layout';

export interface Profile {
  full_name?: string | null;
  email?: string | null;
  username: string;
  avatar_url: string;
  sports: string[];
  region: string;
  onboarding_completed: boolean;
  role: 'player' | 'owner' | 'admin' | 'super_admin';
  is_owner_verified: boolean;
  age?: number | null;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

const PROFILE_CACHE_KEY = 'cached_profile';

let activeController: AbortController | null = null;
let activeTimeout: ReturnType<typeof setTimeout> | null = null;

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,

  fetchProfile: async () => {
    if (activeController) activeController.abort();
    if (activeTimeout) clearTimeout(activeTimeout);

    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      try {
        set({ profile: JSON.parse(cached), loading: false });
      } catch {}
    }

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        set({ profile: null, loading: false });
        return;
      }

      const controller = new AbortController();
      activeController = controller;
      const timeout = setTimeout(() => controller.abort(), 20000);
      activeTimeout = timeout;

      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      activeTimeout = null;
      activeController = null;

      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
        set({ profile: data, loading: false });
      } else {
        set({ profile: null, loading: false });
      }
    } catch (e) {
      activeTimeout = null;
      activeController = null;
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) {
        set({ profile: null, loading: false });
      }
    }
  },

  clearProfile: async () => {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    set({ profile: null, loading: false });
  },
}));
