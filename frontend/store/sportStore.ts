import { create } from 'zustand';
import { apiFetch } from '../lib/apiClient';

export interface Sport {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}

const DEFAULT_SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  tennis: 'sports-tennis',
  mini_soccer: 'sports-soccer',
  padel: 'sports-tennis',
  other: 'sports',
};

const DEFAULT_SPORTS: Sport[] = [
  { id: 1, slug: 'futsal', name: 'Futsal', is_active: true },
  { id: 2, slug: 'badminton', name: 'Badminton', is_active: true },
  { id: 3, slug: 'basketball', name: 'Basket', is_active: true },
  { id: 4, slug: 'volleyball', name: 'Voli', is_active: true },
  { id: 5, slug: 'tennis', name: 'Tenis', is_active: true },
  { id: 6, slug: 'mini_soccer', name: 'Mini Soccer', is_active: true },
  { id: 7, slug: 'padel', name: 'Padel', is_active: true },
];

export function getSportIconName(slug: string): string {
  const normalized = (slug || '').toLowerCase();
  if (DEFAULT_SPORT_ICONS[normalized]) {
    return DEFAULT_SPORT_ICONS[normalized];
  }
  if (normalized.includes('soccer') || normalized.includes('bola') || normalized.includes('football')) {
    return 'sports-soccer';
  }
  if (normalized.includes('basket')) {
    return 'sports-basketball';
  }
  if (normalized.includes('tenis') || normalized.includes('tennis') || normalized.includes('racket') || normalized.includes('badminton')) {
    return 'sports-tennis';
  }
  if (normalized.includes('voli') || normalized.includes('volley')) {
    return 'sports-volleyball';
  }
  return 'sports';
}

interface SportState {
  sports: Sport[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchSports: (force?: boolean) => Promise<void>;
  getSportOptions: () => { label: string; value: string }[];
  getSportLabel: (slugOrName: string) => string;
}

export const useSportStore = create<SportState>((set, get) => ({
  sports: DEFAULT_SPORTS,
  loading: false,
  error: null,
  lastFetched: null,

  fetchSports: async (force = false) => {
    const { sports, lastFetched, loading } = get();
    // Cache for 3 minutes unless forced
    const now = Date.now();
    if (!force && sports.length > 0 && lastFetched && now - lastFetched < 180000) {
      return;
    }
    if (loading) return;

    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/sports', { skipToken: true });
      if (!res.ok) throw new Error('Gagal memuat jenis olahraga');
      const json = await res.json();
      const list: Sport[] = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : DEFAULT_SPORTS);
      const activeList = list.filter(s => s.is_active !== false);
      set({
        sports: activeList.length > 0 ? activeList : DEFAULT_SPORTS,
        loading: false,
        lastFetched: now,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Gagal memuat olahraga',
        loading: false,
      });
    }
  },

  getSportOptions: () => {
    const { sports } = get();
    return sports.map(s => ({
      label: s.name,
      value: s.slug || s.name.toLowerCase().replace(/\s+/g, '_'),
    }));
  },

  getSportLabel: (slugOrName: string) => {
    if (!slugOrName) return '';
    const { sports } = get();
    const found = sports.find(s => s.slug === slugOrName || s.name.toLowerCase() === slugOrName.toLowerCase());
    return found ? found.name : slugOrName;
  },
}));
