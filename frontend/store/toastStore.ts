import { create } from 'zustand';
import type { ToastType } from '../components/shared/AppToast';

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  description: string;
  durationMs: number;
  show: (opts: { type?: ToastType; title: string; description?: string; durationMs?: number }) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  type: 'success',
  title: '',
  description: '',
  durationMs: 3000,
  show: (opts) => set({
    visible: true,
    type: opts.type ?? 'success',
    title: opts.title,
    description: opts.description ?? '',
    durationMs: opts.durationMs ?? 3000,
  }),
  hide: () => set({ visible: false }),
}));
