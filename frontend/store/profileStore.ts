import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';

export interface Profile {
  full_name?: string | null;
  username: string;
  avatar_url: string;
  sports: string[];
  region: string;
  onboarding_completed: boolean;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,

  fetchProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        set({ profile: null, loading: false });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        set({ profile: data, loading: false });
      } else {
        set({ profile: null, loading: false });
      }
    } catch (e) {
      set({ profile: null, loading: false });
    }
  },

  clearProfile: () => set({ profile: null, loading: false }),
}));
