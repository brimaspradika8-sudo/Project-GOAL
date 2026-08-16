import { create } from 'zustand';
import { createBooking, type Booking, type CreateBookingPayload } from '../services/bookingService';

export const MAX_BOOKING_SLOTS = 3;

interface BookingState {
  loading: boolean;
  error: string | null;
  create: (payload: CreateBookingPayload) => Promise<Booking>;
}

export const useBookingStore = create<BookingState>((set) => ({
  loading: false,
  error: null,

  create: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await createBooking(payload);
      set({ loading: false });
      return res.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Terjadi kesalahan pada data booking.', loading: false });
      throw error;
    }
  },
}));
