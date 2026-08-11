import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../lib/apiClient';
import { profileFromApi, type UserRole } from '../types/roles';

export interface Profile {
  id: number;
  user_id: number;
  full_name?: string | null;
  email?: string | null;
  username: string;
  avatar_url: string;
  sports: string[];
  region: string;
  onboarding_completed: boolean;
  role: UserRole;
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

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,

  fetchProfile: async () => {
    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      try {
        set({ profile: JSON.parse(cached), loading: false });
      } catch {}
    }

    try {
      const res = await apiFetch('/me');

      if (res.ok) {
        const data = profileFromApi<Profile>(await res.json());
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
        set({ profile: data, loading: false });
      } else {
        set({ profile: null, loading: false });
      }
    } catch {
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
