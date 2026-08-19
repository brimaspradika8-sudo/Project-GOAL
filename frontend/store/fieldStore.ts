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
  latitude?: number | null;
  longitude?: number | null;
  rating?: number;
  reviews_count?: number;
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

const MOCK_COORDS = [
  { lat: -6.2186, lng: 106.8024 }, // GBK Senayan
  { lat: -6.2245, lng: 106.8089 }, // SCBD
  { lat: -6.2375, lng: 106.8521 }, // Tebet
  { lat: -6.1754, lng: 106.8272 }, // Monas / Gambir
  { lat: -6.2615, lng: 106.8106 }, // Kemang
  { lat: -6.3016, lng: 106.6534 }, // BSD City
  { lat: -6.2443, lng: 106.9248 }, // Bekasi
  { lat: -6.9175, lng: 107.6191 }, // Bandung
];

const MOCK_SPORT_IMAGES: Record<string, string[]> = {
  futsal: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop',
  ],
  basketball: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop',
  ],
  badminton: [
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617083934555-ac7d4fed8814?q=80&w=800&auto=format&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop',
  ],
};

function normalizeFieldsResponse(body: unknown): { data: Field[]; meta: PaginationMeta | null } {
  if (!body || typeof body !== 'object') {
    return { data: [], meta: null };
  }

  const payload = body as { data?: unknown; meta?: unknown };
  const rawList = Array.isArray(payload.data) ? (payload.data as Field[]) : [];

  const enrichedData: Field[] = rawList.map((item, idx) => {
    const coords = MOCK_COORDS[idx % MOCK_COORDS.length];
    const sportKey = item.sport_type?.toLowerCase() || 'futsal';
    const fallbackList = MOCK_SPORT_IMAGES[sportKey] || MOCK_SPORT_IMAGES.default;

    let images: FieldImage[] = item.images && item.images.length > 0 ? item.images : [];

    if (images.length === 0) {
      const primaryUrl = item.image_url || fallbackList[0];
      images = [
        { id: item.id * 10 + 1, field_id: item.id, image_path: primaryUrl, is_primary: true },
        ...fallbackList.slice(1).map((url, i) => ({
          id: item.id * 10 + i + 2,
          field_id: item.id,
          image_path: url,
          is_primary: false,
        })),
      ];
    }

    return {
      ...item,
      latitude: item.latitude ?? coords.lat,
      longitude: item.longitude ?? coords.lng,
      rating: item.rating ?? Number((4.5 + ((item.id % 5) * 0.1)).toFixed(1)),
      reviews_count: item.reviews_count ?? (12 + item.id * 7),
      image_url: item.image_url || images[0]?.image_path || fallbackList[0],
      images,
    };
  });

  return {
    data: enrichedData,
    meta: payload.meta && typeof payload.meta === 'object' ? (payload.meta as PaginationMeta) : null,
  };
}

let currentFieldAbortController: AbortController | null = null;

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
  lastParams: {},
  _fetchGen: 0,

  fetchFields: async (sport?: string, search?: string, filters: FieldFilters = {}) => {
    if (currentFieldAbortController) {
      currentFieldAbortController.abort();
    }
    const controller = new AbortController();
    currentFieldAbortController = controller;

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
        signal: controller.signal,
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
      if (state._fetchGen !== gen || controller.signal.aborted) return;

      await AsyncStorage.setItem(cacheKey, JSON.stringify(body));

      set({
        fields: normalized.data,
        meta: normalized.meta,
        loading: false,
        _fetchGen: gen,
        lastParams: { sport, search, filters },
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) return;
      const state = get();
      if (state._fetchGen !== gen) return;

      const hasCache = !!await AsyncStorage.getItem(cacheKey);
      if (!hasCache) {
        set({ error: parseErrorMessage(e), loading: false });
      }
    } finally {
      if (currentFieldAbortController === controller) {
        currentFieldAbortController = null;
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
