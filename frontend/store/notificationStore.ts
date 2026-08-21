import { create } from 'zustand';
import { apiFetch } from '../lib/apiClient';

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
  clearAll: () => Promise<{ success: boolean; deleted: number }>;
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
      const res = await apiFetch('/notifications', { params: { page: '1' } });

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
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
    } catch {
      set({
        items: get().items.map((n) => (n.id === id ? { ...n, read: false } : n)),
      });
    }
  },

  markAllRead: async () => {
    set({ items: get().items.map((n) => ({ ...n, read: true })) });

    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
    } catch {
      await get().refresh();
    }
  },

  clearAll: async () => {
    try {
      const res = await apiFetch('/notifications/clear-all', { method: 'POST' });
      if (res.ok) {
        set({ items: [] });
        const data = await res.json().catch(() => ({}));
        return { success: true, deleted: Number(data?.data?.deleted ?? 0) };
      }
      return { success: false, deleted: 0 };
    } catch {
      return { success: false, deleted: 0 };
    }
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,
}));
