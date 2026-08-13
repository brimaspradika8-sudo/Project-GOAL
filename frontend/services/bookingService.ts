import { apiGet, apiSend, apiFetch } from '../lib/apiClient';
import type { Field } from '../store/fieldStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'WAITING_OWNER_APPROVAL'
  | 'APPROVED'
  | 'WAITING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface BookingField {
  id: number;
  name: string;
  sport_type: string;
  location: string;
  image_url: string | null;
  price_per_hour: number | null;
  owner_id: number | null;
}

export interface Booking {
  id: number;
  user_id: number;
  field_id: number;
  booking_date: string;       // "YYYY-MM-DD"
  start_time: string;         // "HH:MM"
  end_time: string;           // "HH:MM"
  duration_minutes: number;
  total_price: number;
  status: BookingStatus;
  expired_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  confirmed_at: string | null;
  confirmed_by: number | null;
  completed_at: string | null;
  created_at: string;
  field?: BookingField;
  user?: { id: number; name: string };
}

export interface TimeSlot {
  start_time: string;   // "HH:MM"
  end_time: string;     // "HH:MM"
  status: 'AVAILABLE' | 'BOOKED' | 'CLOSED';
}

export type FieldLiveStatus = 'AVAILABLE' | 'BOOKED' | 'PLAYING';

export interface SlotsResponse {
  field: any;
  lapangan: { id: number; name: string };
  date: string;
  tanggal: string;
  field_status: FieldLiveStatus;
  slots: TimeSlot[];
}

export interface CreateBookingPayload {
  field_id: number;
  booking_date: string;  // "YYYY-MM-DD"
  slots: Array<{ start_time: string; end_time: string }>;
}

export interface BookingHistoryResponse {
  data: Booking[];
  pagination: { current_page: number; last_page: number; total: number };
}

const emptyPagination = { current_page: 1, last_page: 1, total: 0 };

function normalizeBookingListResponse(res: any): BookingHistoryResponse {
  const payload = res?.data?.data !== undefined ? res.data : res;
  const bookings = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    data: bookings,
    pagination: payload?.pagination ?? emptyPagination,
  };
}

// ─── Service Functions ─────────────────────────────────────────────────────────

/**
 * GET /lapangan/{id}/slots?tanggal=YYYY-MM-DD
 * Fetch available time slots for a field on a given date.
 */
export async function getSlots(fieldId: number, date: string): Promise<SlotsResponse> {
  const res = await apiFetch(`/lapangan/${fieldId}/slots`, {
    params: { tanggal: date },
    skipToken: true,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, message: data?.message || 'Gagal memuat slot' };
  }
  const body = await res.json();
  // Response is wrapped in { message, data: { slots, field_status, ... } }
  return body.data ?? body;
}

/**
 * Alias of getSlots for the booking create flow.
 * GET /lapangan/{id}/slots?tanggal=YYYY-MM-DD
 */
export async function getAvailableSlots(fieldId: number, date: string): Promise<SlotsResponse> {
  return getSlots(fieldId, date);
}

/**
 * GET /fields/{id}
 * Fetch field detail for the booking create screen.
 */
export async function getFieldDetail(fieldId: number): Promise<Field> {
  const res = await apiFetch(`/fields/${fieldId}`, { skipToken: true });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, message: data?.message || 'Gagal memuat detail lapangan' };
  }
  return res.json();
}

/**
 * POST /bookings
 * Create a new booking request.
 */
export async function createBooking(payload: CreateBookingPayload): Promise<{ data: Booking; message: string }> {
  return apiSend('POST', '/bookings', { body: payload });
}

/**
 * GET /bookings/{id}
 * Fetch single booking detail.
 */
export async function getBooking(id: number): Promise<{ data: Booking; message: string }> {
  return apiGet(`/bookings/${id}`);
}

/**
 * GET /bookings/history
 * Fetch user's booking history (all statuses).
 */
export async function getBookingHistory(page = 1): Promise<BookingHistoryResponse> {
  const res: any = await apiGet('/bookings/history', { params: { page } });
  return normalizeBookingListResponse(res);
}

/**
 * GET /bookings/my
 * Fetch user's active / upcoming bookings.
 */
export async function getMyBookings(page = 1): Promise<BookingHistoryResponse> {
  const res: any = await apiGet('/bookings/my', { params: { page } });
  return normalizeBookingListResponse(res);
}

/**
 * PATCH /bookings/{id}/cancel
 * Cancel a booking.
 */
export async function cancelBooking(id: number, reason: string): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/bookings/${id}/cancel`, { body: { reason } });
}

/**
 * PATCH /bookings/{id}/confirm
 * Confirm payment — player confirms their own booking.
 * Also used by owner to confirm cash payment (same endpoint, authorized via BookingPolicy).
 */
export async function confirmPayment(id: number): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/bookings/${id}/confirm`, {});
}

/**
 * PATCH /owner/bookings/{id}/approve
 * Owner approves a booking request.
 */
export async function ownerApproveBooking(id: number): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/owner/bookings/${id}/approve`, {});
}

/**
 * PATCH /owner/bookings/{id}/reject
 * Owner rejects a booking request with an optional reason.
 */
export async function ownerRejectBooking(id: number, reason?: string): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/owner/bookings/${id}/reject`, { body: { reason: reason ?? '' } });
}

/**
 * GET /owner/bookings
 * Fetch all bookings for the authenticated owner.
 */
export async function getOwnerBookings(page = 1): Promise<BookingHistoryResponse> {
  const res: any = await apiGet('/owner/bookings', { params: { page } });
  return normalizeBookingListResponse(res);
}
