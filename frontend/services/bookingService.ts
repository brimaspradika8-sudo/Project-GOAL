import { apiGet, apiSend, apiFetch } from '../lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'WAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PAID'
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
  session_duration_minutes: number | null;
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
  payment_method: string;
  status: BookingStatus;
  expired_at: string | null;
  payment_expired_at: string | null;
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
  status: 'AVAILABLE' | 'BOOKED' | 'BUFFER' | 'CLOSED';
  price: number | null;
}

export type FieldLiveStatus = 'AVAILABLE' | 'BOOKED' | 'PLAYING';

export interface SlotsResponse {
  field: any;
  lapangan: { id: number; name: string };
  date: string;
  tanggal: string;
  field_status: FieldLiveStatus;
  slots: TimeSlot[];
  closed_days?: number[];
  holidays?: string[];
}

export interface CreateBookingPayload {
  field_id: number;
  booking_date: string;  // "YYYY-MM-DD"
  slots: Array<{ start_time: string; end_time: string }>;
  payment_method: 'cash';
}

export interface BookingHistoryResponse {
  data: Booking[];
  pagination: { current_page: number; last_page: number; total: number };
}

export interface FieldScheduleItem {
  id?: number;
  field_id?: number;
  day_of_week: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  open_time: string;   // "08:00"
  close_time: string;  // "22:00"
  is_closed: boolean;
}

export interface FieldHolidayItem {
  id: number;
  field_id: number;
  date: string;
  reason: string | null;
}

export interface FieldBlockedSlotItem {
  id: number;
  field_id: number;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
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
  return body.data ?? body;
}

/**
 * POST /booking
 * Create a new booking request.
 */
export async function createBooking(payload: CreateBookingPayload): Promise<{ data: Booking; message: string }> {
  return apiSend('POST', '/booking', { body: payload });
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
 * DELETE /bookings/bulk
 * Bulk delete user's bookings.
 */
export async function bulkDeleteBookings(bookingIds: number[]): Promise<{ message: string; data: { deleted_count: number } }> {
  return apiSend('DELETE', '/bookings/bulk', { body: { booking_ids: bookingIds } });
}

/**
 * PATCH /bookings/{id}/cancel
 * Cancel a booking.
 */
export async function cancelBooking(id: number, reason: string): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/bookings/${id}/cancel`, { body: { reason } });
}

/**
 * PATCH /owner/bookings/{id}/approve
 * Owner approves a booking request (transitions to CONFIRMED).
 */
export async function ownerApproveBooking(id: number): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/owner/bookings/${id}/approve`, {});
}

/**
 * PATCH /owner/bookings/{id}/confirm-payment
 * Owner confirms manual payment (transitions to PAID).
 */
export async function ownerConfirmPaymentBooking(id: number): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/owner/bookings/${id}/set-paid`, {});
}

/**
 * PATCH /owner/bookings/{id}/reject
 * Owner rejects a booking request with an optional reason.
 */
export async function ownerRejectBooking(id: number, reason?: string): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/owner/bookings/${id}/reject`, { body: { reason: reason ?? '' } });
}

/**
 * PATCH /owner/bookings/{id}/complete
 * Owner marks a confirmed booking as completed.
 */
export async function ownerCompleteBooking(id: number): Promise<{ data: Booking; message: string }> {
  return apiSend('PATCH', `/owner/bookings/${id}/complete`, {});
}

/**
 * GET /owner/bookings
 * Fetch all bookings for the authenticated owner.
 */
export async function getOwnerBookings(page = 1): Promise<BookingHistoryResponse> {
  const res: any = await apiGet('/owner/bookings', { params: { page } });
  return normalizeBookingListResponse(res);
}

// ─── Owner Schedule & Settings API ─────────────────────────────────────────────

export async function getOwnerSchedules(fieldId: number): Promise<{ data: { schedules: FieldScheduleItem[] } }> {
  return apiGet(`/owner/fields/${fieldId}/schedules`);
}

export async function updateOwnerSchedules(fieldId: number, schedules: FieldScheduleItem[]): Promise<{ message: string; data: { schedules: FieldScheduleItem[] } }> {
  return apiSend('PUT', `/owner/fields/${fieldId}/schedules`, { body: { schedules } });
}

export async function getOwnerHolidays(fieldId: number): Promise<{ data: { holidays: FieldHolidayItem[] } }> {
  return apiGet(`/owner/fields/${fieldId}/holidays`);
}

export async function addOwnerHoliday(fieldId: number, date: string, reason?: string): Promise<{ message: string; data: { holiday: FieldHolidayItem } }> {
  return apiSend('POST', `/owner/fields/${fieldId}/holidays`, { body: { date, reason } });
}

export async function deleteOwnerHoliday(holidayId: number): Promise<{ message: string }> {
  return apiSend('DELETE', `/owner/holidays/${holidayId}`, {});
}

export async function getOwnerBlockedSlots(fieldId: number): Promise<{ data: { blocked_slots: FieldBlockedSlotItem[] } }> {
  return apiGet(`/owner/fields/${fieldId}/blocked-slots`);
}

export async function addOwnerBlockedSlot(
  fieldId: number,
  data: { date: string; start_time: string; end_time: string; reason?: string }
): Promise<{ message: string; data: { blocked_slot: FieldBlockedSlotItem } }> {
  return apiSend('POST', `/owner/fields/${fieldId}/blocked-slots`, { body: data });
}

export async function deleteOwnerBlockedSlot(blockedSlotId: number): Promise<{ message: string }> {
  return apiSend('DELETE', `/owner/blocked-slots/${blockedSlotId}`, {});
}

export async function createOwnerManualBooking(payload: {
  field_id: number;
  booking_date: string;
  slots: { start_time: string; end_time: string }[];
  customer_name: string;
  customer_phone?: string;
  payment_method?: string;
}): Promise<{ message: string; data: Booking }> {
  return apiSend('POST', '/owner/bookings/manual', { body: payload });
}
