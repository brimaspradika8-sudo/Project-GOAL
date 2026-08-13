import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAvailableSlots,
  getBooking,
  getBookingHistory,
  getMyBookings,
  type SlotsResponse,
  type Booking,
  type BookingStatus,
} from '../services/bookingService';

// ─── useSlots ─────────────────────────────────────────────────────────────────

interface UseSlotsResult {
  slotsData: SlotsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSlots(fieldId: number | null, date: string): UseSlotsResult {
  const [slotsData, setSlotsData] = useState<SlotsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!fieldId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailableSlots(fieldId, date);
      setSlotsData(data);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat slot waktu');
    } finally {
      setLoading(false);
    }
  }, [fieldId, date]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { slotsData, loading, error, refetch: fetch };
}

// ─── useBookingDetail ─────────────────────────────────────────────────────────

interface UseBookingDetailResult {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBookingDetail(bookingId: number | null): UseBookingDetailResult {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await getBooking(bookingId);
      setBooking(res.data ?? (res as any));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { booking, loading, error, refetch: fetch };
}

// ─── useBookingPolling ────────────────────────────────────────────────────────
// Polls GET /bookings/{id} every 5 seconds and calls onStatusChange when status transitions.

interface UseBookingPollingOptions {
  bookingId: number | null;
  targetStatuses: BookingStatus[];
  onStatusChange: (booking: Booking) => void;
  interval?: number; // ms, default 5000
  enabled?: boolean;
}

export function useBookingPolling({
  bookingId,
  targetStatuses,
  onStatusChange,
  interval = 5000,
  enabled = true,
}: UseBookingPollingOptions): { booking: Booking | null; error: string | null } {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    if (!bookingId || !enabled) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getBooking(bookingId);
        const b: Booking = res.data ?? (res as any);
        if (cancelled) return;
        setBooking(b);
        if (targetStatuses.includes(b.status)) {
          onStatusChangeRef.current(b);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Gagal memeriksa status booking');
      }
    };

    poll(); // immediate first call
    const timer = setInterval(poll, interval);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId, enabled, interval, targetStatuses]);

  return { booking, error };
}

// ─── useBookingHistory ────────────────────────────────────────────────────────

interface UseBookingHistoryResult {
  bookings: Booking[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBookingHistory(): UseBookingHistoryResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async ({ isRefresh = false, silent = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getBookingHistory();
      setBookings(res.data ?? []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat riwayat booking');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => fetch({ isRefresh: true }), [fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetch({ silent: true });
    }, 10000);

    return () => clearInterval(timer);
  }, [fetch]);

  return {
    bookings,
    loading,
    refreshing,
    error,
    refresh,
  };
}
