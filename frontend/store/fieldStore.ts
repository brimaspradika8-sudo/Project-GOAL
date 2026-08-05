import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../lib/apiClient';

export interface Field {
  id: number;
  name: string;
  sport_type: string;
  location: string;
  description: string | null;
  price_per_hour: number | null;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  owner?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface FieldState {
  fields: Field[];
  meta: PaginationMeta | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  fetchFields: (sport?: string, search?: string) => Promise<void>;
  fetchMore: () => Promise<void>;
  refreshFields: () => Promise<void>;
  clearCache: () => Promise<void>;
  lastParams: { sport?: string; search?: string };
  _fetchGen: number;
}

const FIELDS_CACHE_KEY = 'cached_fields_';

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
  lastParams: {},
  _fetchGen: 0,

  fetchFields: async (sport?: string, search?: string) => {
    const gen = Date.now();
    const cacheKey = FIELDS_CACHE_KEY + (sport ?? 'all') + '_' + (search ?? '');

    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        set({ fields: parsed.data, meta: parsed.meta, loading: false, _fetchGen: gen });
      } catch {}
    } else {
      set({ loading: true, error: null, _fetchGen: gen });
    }

    try {
      const res = await apiFetch('/fields', {
        params: {
          ...(sport && sport !== 'Semua' ? { sport } : {}),
          ...(search ? { search } : {}),
          page: '1',
        },
      });
      if (!res.ok) throw new Error('Gagal memuat data lapangan');
      const body = await res.json();

      const state = get();
      if (state._fetchGen !== gen) return;

      await AsyncStorage.setItem(cacheKey, JSON.stringify(body));

      set({
        fields: body.data,
        meta: body.meta,
        loading: false,
        _fetchGen: gen,
        lastParams: { sport, search },
      });
    } catch (e: any) {
      const state = get();
      if (state._fetchGen !== gen) return;

      const hasCache = !!await AsyncStorage.getItem(cacheKey);
      if (!hasCache) {
        set({ error: e.message || 'Terjadi kesalahan', loading: false });
      }
    }
  },

  fetchMore: async () => {
    const { meta, loadingMore, lastParams, fields } = get();
    if (!meta || meta.current_page >= meta.last_page || loadingMore) return;

    set({ loadingMore: true });
    try {
      const res = await apiFetch('/fields', {
        params: {
          ...(lastParams.sport && lastParams.sport !== 'Semua' ? { sport: lastParams.sport } : {}),
          ...(lastParams.search ? { search: lastParams.search } : {}),
          page: String(meta.current_page + 1),
        },
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const body = await res.json();
      set({
        fields: [...fields, ...body.data],
        meta: body.meta,
        loadingMore: false,
      });
    } catch {
      set({ loadingMore: false });
    }
  },

  refreshFields: async () => {
    const { lastParams } = get();
    const cacheKey = FIELDS_CACHE_KEY + (lastParams.sport ?? 'all') + '_' + (lastParams.search ?? '');
    await AsyncStorage.removeItem(cacheKey);
    await get().fetchFields(lastParams.sport, lastParams.search);
  },

  clearCache: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const fieldKeys = keys.filter(k => k.startsWith(FIELDS_CACHE_KEY));
      if (fieldKeys.length > 0) {
        await AsyncStorage.multiRemove(fieldKeys);
      }
    } catch {}
  },
}));
