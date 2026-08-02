import { create } from 'zustand';
import { API_BASE_URL, DEFAULT_HEADERS } from '../lib/api';
import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../lib/auth';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  type?: string;
  data?: any;
}

interface ServerNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: any;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  items: AppNotification[];
  hydrated: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<number>;
  unreadCount: () => number;
}

function mapNotification(raw: ServerNotification): AppNotification {
  return {
    id: String(raw.id),
    title: raw.title,
    description: raw.body ?? '',
    created_at: raw.created_at,
    read: raw.read,
    type: raw.type,
    data: raw.data,
  };
}

let inFlight = false;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  hydrated: false,
  loading: false,

  clear: () => {
    set({ items: [], hydrated: false, loading: false });
  },

  refresh: async () => {
    if (inFlight) return;
    inFlight = true;
    set({ loading: true });

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ items: [], hydrated: true, loading: false });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_BASE_URL}/notifications?page=1`, {
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data.map(mapNotification) : [];
        set({ items: list, hydrated: true, loading: false });
      } else {
        set({ items: [], hydrated: true, loading: false });
      }
    } catch {
      set({ hydrated: true, loading: false });
    } finally {
      inFlight = false;
    }
  },

  markAsRead: async (id: string) => {
    const item = get().items.find((n) => n.id === id);
    if (!item || item.read) return;

    set({
      items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
    } catch {
      set({
        items: get().items.map((n) => (n.id === id ? { ...n, read: false } : n)),
      });
    }
  },

  markAllRead: async () => {
    set({ items: get().items.map((n) => ({ ...n, read: true })) });

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
    } catch {
      await get().refresh();
    }
  },

  clearAll: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ items: [] });
      return 0;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        set({ items: [] });
        const data = await res.json().catch(() => ({}));
        return Number(data?.deleted ?? 0);
      }
      return 0;
    } catch {
      await get().refresh();
      return 0;
    }
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,
}));
