import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSlots,
  getBooking,
  getBookingHistory,
  type SlotsResponse,
  type Booking,
} from '../services/bookingService';

// ─── useNow ───────────────────────────────────────────────────────────────────
// Returns the device's current time, refreshed every `intervalMs` so slot
// availability follows real time while the screen stays open.

export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

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
  const cancelledRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!fieldId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSlots(fieldId, date);
      if (cancelledRef.current) return;
      setSlotsData(data);
    } catch (e: any) {
      if (cancelledRef.current) return;
      setError(e?.message || 'Gagal memuat slot waktu');
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [fieldId, date]);

  useEffect(() => {
    cancelledRef.current = false;
    fetch();
    return () => {
      cancelledRef.current = true;
    };
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
  const cancelledRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await getBooking(bookingId);
      if (cancelledRef.current) return;
      setBooking(res.data ?? (res as any));
      setError(null);
    } catch (e: any) {
      if (cancelledRef.current) return;
      setError(e?.message || 'Gagal memuat data booking');
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    cancelledRef.current = false;
    fetch();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetch]);

  return { booking, loading, error, refetch: fetch };
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
  const cancelledRef = useRef(false);

  const fetch = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getBookingHistory();
      if (cancelledRef.current) return;
      setBookings(res.data ?? []);
    } catch (e: any) {
      if (cancelledRef.current) return;
      setError(e?.message || 'Gagal memuat riwayat booking');
    } finally {
      if (cancelledRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => fetch({ isRefresh: true }), [fetch]);

  useEffect(() => {
    cancelledRef.current = false;
    fetch();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetch]);

  return {
    bookings,
    loading,
    refreshing,
    error,
    refresh,
  };
}
