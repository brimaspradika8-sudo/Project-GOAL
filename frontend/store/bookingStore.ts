import { create } from 'zustand';
import {
  cancelBooking,
  createBooking,
  getBookingHistory,
  getMyBookings,
  getOwnerBookings,
  ownerApproveBooking,
  ownerRejectBooking,
  type Booking,
  type BookingHistoryResponse,
  type CreateBookingPayload,
} from '../services/bookingService';

interface BookingState {
  bookings: Booking[];
  ownerBookings: Booking[];
  pagination: BookingHistoryResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  fetchMyBookings: (page?: number) => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  fetchOwnerBookings: (page?: number) => Promise<void>;
  create: (payload: CreateBookingPayload) => Promise<Booking>;
  cancel: (id: number, reason: string) => Promise<void>;
  approve: (id: number) => Promise<void>;
  reject: (id: number, reason?: string) => Promise<void>;
  reset: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan pada data booking.';
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  ownerBookings: [],
  pagination: null,
  loading: false,
  error: null,

  fetchMyBookings: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await getMyBookings(page);
      set({ bookings: res.data, pagination: res.pagination, loading: false });
    } catch (error) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  fetchHistory: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await getBookingHistory(page);
      set({ bookings: res.data, pagination: res.pagination, loading: false });
    } catch (error) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  fetchOwnerBookings: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await getOwnerBookings(page);
      set({ ownerBookings: res.data, pagination: res.pagination, loading: false });
    } catch (error) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  create: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await createBooking(payload);
      set((state) => ({ bookings: [res.data, ...state.bookings], loading: false }));
      return res.data;
    } catch (error) {
      set({ error: errorMessage(error), loading: false });
      throw error;
    }
  },

  cancel: async (id, reason) => {
    set({ error: null });
    const res = await cancelBooking(id, reason);
    set({
      bookings: get().bookings.map((booking) => booking.id === id ? res.data : booking),
    });
  },

  approve: async (id) => {
    set({ error: null });
    const res = await ownerApproveBooking(id);
    set({
      ownerBookings: get().ownerBookings.map((booking) => booking.id === id ? res.data : booking),
    });
  },

  reject: async (id, reason) => {
    set({ error: null });
    const res = await ownerRejectBooking(id, reason);
    set({
      ownerBookings: get().ownerBookings.map((booking) => booking.id === id ? res.data : booking),
    });
  },

  reset: () => set({ bookings: [], ownerBookings: [], pagination: null, loading: false, error: null }),
}));
