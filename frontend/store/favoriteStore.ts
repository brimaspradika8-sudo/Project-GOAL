import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const FAVORITES_STORAGE_KEY = 'favorite_field_ids';

interface FavoriteState {
  favoriteIds: number[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFavorite: (fieldId: number) => boolean;
  toggleFavorite: (fieldId: number) => Promise<boolean>;
  clear: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      set({
        favoriteIds: Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [],
        hydrated: true,
      });
    } catch {
      set({ favoriteIds: [], hydrated: true });
    }
  },

  isFavorite: (fieldId: number) => get().favoriteIds.includes(fieldId),

  toggleFavorite: async (fieldId: number) => {
    const current = get().favoriteIds;
    const exists = current.includes(fieldId);
    const next = exists ? current.filter((id) => id !== fieldId) : [...current, fieldId];

    set({ favoriteIds: next });
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));

    return !exists;
  },

  clear: () => {
    set({ favoriteIds: [], hydrated: false });
  },
}));
