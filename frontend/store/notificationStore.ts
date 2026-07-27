import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const NOTIFICATIONS_STORAGE_KEY = 'goal_notifications';
const MAX_NOTIFICATIONS = 30;

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  created_at: string;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addNotification: (payload: { title: string; description: string }) => Promise<void>;
  markAllRead: () => Promise<void>;
  unreadCount: () => number;
}

async function persistNotifications(items: AppNotification[]) {
  await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      set({ items: Array.isArray(parsed) ? parsed : [], hydrated: true });
    } catch {
      set({ items: [], hydrated: true });
    }
  },

  addNotification: async ({ title, description }) => {
    const nextItem: AppNotification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      created_at: new Date().toISOString(),
      read: false,
    };

    const next = [nextItem, ...get().items].slice(0, MAX_NOTIFICATIONS);
    set({ items: next });
    await persistNotifications(next);
  },

  markAllRead: async () => {
    const next = get().items.map((item) => ({ ...item, read: true }));
    set({ items: next });
    await persistNotifications(next);
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,
}));
