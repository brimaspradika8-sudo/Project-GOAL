import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../lib/apiClient';

export interface FieldImage {
  id: number;
  field_id: number;
  image_path: string;
  is_primary: boolean;
  created_at?: string | null;
}

export interface Field {
  id: number;
  name: string;
  sport_type: string;
  location: string;
  address?: string | null;
  description: string | null;
  price_per_hour: number | null;
  session_duration_minutes: number | null;
  image_url: string | null;
  images?: FieldImage[];
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

export interface FieldFilters {
  minPrice?: string;
  maxPrice?: string;
  sort?: 'latest' | 'price_asc' | 'price_desc';
}

interface FieldState {
  fields: Field[];
  meta: PaginationMeta | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  fetchFields: (sport?: string, search?: string, filters?: FieldFilters) => Promise<void>;
  fetchMore: () => Promise<void>;
  refreshFields: () => Promise<void>;
  clearCache: () => Promise<void>;
  lastParams: { sport?: string; search?: string; filters?: FieldFilters };
  _fetchGen: number;
}

const FIELDS_CACHE_KEY = 'cached_fields_';

function parseErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan';
}

function normalizeFieldsResponse(body: unknown): { data: Field[]; meta: PaginationMeta | null } {
  if (!body || typeof body !== 'object') {
    return { data: [], meta: null };
  }

  const payload = body as { data?: unknown; meta?: unknown };

  return {
    data: Array.isArray(payload.data) ? payload.data as Field[] : [],
    meta: payload.meta && typeof payload.meta === 'object' ? payload.meta as PaginationMeta : null,
  };
}

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
  lastParams: {},
  _fetchGen: 0,

  fetchFields: async (sport?: string, search?: string, filters: FieldFilters = {}) => {
    const gen = Date.now();
    const cacheKey = FIELDS_CACHE_KEY + JSON.stringify({ sport: sport ?? 'all', search: search ?? '', filters });

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
          ...(filters.minPrice ? { min_price: filters.minPrice } : {}),
          ...(filters.maxPrice ? { max_price: filters.maxPrice } : {}),
          ...(filters.sort && filters.sort !== 'latest' ? { sort: filters.sort } : {}),
          page: '1',
        },
      });
      if (!res.ok) throw new Error('Gagal memuat data lapangan');
      const body = await res.json();
      const normalized = normalizeFieldsResponse(body);

      const state = get();
      if (state._fetchGen !== gen) return;

      await AsyncStorage.setItem(cacheKey, JSON.stringify(body));

      set({
        fields: normalized.data,
        meta: normalized.meta,
        loading: false,
        _fetchGen: gen,
        lastParams: { sport, search, filters },
      });
    } catch (e) {
      const state = get();
      if (state._fetchGen !== gen) return;

      const hasCache = !!await AsyncStorage.getItem(cacheKey);
      if (!hasCache) {
        set({ error: parseErrorMessage(e), loading: false });
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
          ...(lastParams.filters?.minPrice ? { min_price: lastParams.filters.minPrice } : {}),
          ...(lastParams.filters?.maxPrice ? { max_price: lastParams.filters.maxPrice } : {}),
          ...(lastParams.filters?.sort && lastParams.filters.sort !== 'latest' ? { sort: lastParams.filters.sort } : {}),
          page: String(meta.current_page + 1),
        },
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const body = await res.json();
      const normalized = normalizeFieldsResponse(body);
      set({
        fields: [...fields, ...normalized.data],
        meta: normalized.meta,
        loadingMore: false,
      });
    } catch {
      set({ loadingMore: false });
    }
  },

  refreshFields: async () => {
    const { lastParams } = get();
    const cacheKey = FIELDS_CACHE_KEY + JSON.stringify({ sport: lastParams.sport ?? 'all', search: lastParams.search ?? '', filters: lastParams.filters ?? {} });
    await AsyncStorage.removeItem(cacheKey);
    await get().fetchFields(lastParams.sport, lastParams.search, lastParams.filters);
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
