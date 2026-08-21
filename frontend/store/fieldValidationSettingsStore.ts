import { create } from 'zustand';
import {
  type FieldValidationSettings,
  DEFAULT_FIELD_VALIDATION_SETTINGS,
  fetchFieldValidationSettings,
  saveFieldValidationSettings,
} from '../lib/fieldValidationSettings';

interface FieldValidationSettingsState {
  settings: FieldValidationSettings;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchSettings: (force?: boolean) => Promise<FieldValidationSettings>;
  updateSettings: (payload: FieldValidationSettings) => Promise<FieldValidationSettings>;
  setSettings: (settings: FieldValidationSettings) => void;
}

export const useFieldValidationSettingsStore = create<FieldValidationSettingsState>((set, get) => ({
  settings: DEFAULT_FIELD_VALIDATION_SETTINGS,
  loading: false,
  loaded: false,
  error: null,
  lastFetched: null,

  fetchSettings: async (force = false) => {
    const { settings, lastFetched, loading, loaded } = get();
    const now = Date.now();
    // Cache for 3 minutes unless forced
    if (!force && loaded && lastFetched && now - lastFetched < 180000) {
      return settings;
    }
    if (loading) return settings;

    set({ loading: true, error: null });
    try {
      const data = await fetchFieldValidationSettings();
      const newSettings = data || DEFAULT_FIELD_VALIDATION_SETTINGS;
      set({
        settings: newSettings,
        loading: false,
        loaded: true,
        lastFetched: now,
      });
      return newSettings;
    } catch (err: any) {
      set({
        error: err.message || 'Gagal memuat pengaturan validasi',
        loading: false,
      });
      return get().settings;
    }
  },

  updateSettings: async (payload: FieldValidationSettings) => {
    set({ loading: true, error: null });
    try {
      const updated = await saveFieldValidationSettings(payload);
      set({
        settings: updated,
        loading: false,
        loaded: true,
        lastFetched: Date.now(),
      });
      return updated;
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Gagal menyimpan aturan validasi' });
      throw err;
    }
  },

  setSettings: (settings: FieldValidationSettings) => {
    set({ settings, loaded: true, lastFetched: Date.now() });
  },
}));
