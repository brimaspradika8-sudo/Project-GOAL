import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../lib/theme';
import { FONT_FAMILY, FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import { useToastStore } from '../../store/toastStore';
import { apiFetch } from '../../lib/apiClient';
import {
  createOwnerManualBooking,
  type TimeSlot,
} from '../../services/bookingService';
import { formatCurrency } from '../../lib/format';
import { useIsMobileWeb } from '../../lib/responsive';
import { HorizontalDatePicker } from '../booking';
import { useSlots, useNow } from '../../hooks/useBooking';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Field {
  id: number;
  name: string;
  sport_type: string;
  price_per_hour: number | null;
  session_duration_minutes: number | null;
}

interface CartItem {
  slot: TimeSlot;
  fieldId: number;
  fieldName: string;
  date: string;
  price: number;
}

interface Transaction {
  id: number;
  customer_name: string;
  customer_phone?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  field?: { name: string };
  created_at: string;
  status: string;
}

// ─── Date Helpers ───────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTimeShort(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ─── Receipt Modal ──────────────────────────────────────────────────────────────

function ReceiptModal({
  visible,
  onClose,
  booking,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  booking: any;
  colors: ThemeColors;
}) {
  if (!booking) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <MaterialIcons name="check-circle" size={32} color="#10B981" />
            </View>
            <Text style={{ fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
              Transaksi Berhasil!
            </Text>
            <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary }}>
              Booking #{booking.id} telah dicatat
            </Text>
          </View>

          {/* Struk */}
          <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 16, marginBottom: 20, gap: 10 }}>
            <Row label="Pelanggan" value={booking.customer_name || booking.user?.name || '-'} colors={colors} />
            <Row label="Lapangan" value={booking.field?.name || '-'} colors={colors} />
            <Row label="Tanggal" value={booking.booking_date || '-'} colors={colors} />
            <Row label="Jam" value={`${booking.start_time} – ${booking.end_time}`} colors={colors} />
            <View style={{ height: 1, backgroundColor: colors.outline, marginVertical: 4 }} />
            <Row label="Total Bayar" value={formatCurrency(booking.total_price)} colors={colors} bold />
            <Row label="Metode" value="Cash (Offline)" colors={colors} />
            <Row label="Status" value="CONFIRMED" colors={colors} valueColor="#10B981" />
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: '#fff' }}>
              Tutup & Transaksi Baru
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, colors, bold, valueColor }: { label: string; value: string; colors: ThemeColors; bold?: boolean; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: bold ? '800' : '600', color: valueColor || colors.text }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Slot Palette (same as venue-detail) ────────────────────────────────────────

const SLOT_PALETTE: Partial<Record<string, { bg: string; border: string; text: string }>> = {
  BOOKED:  { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' },
  BUFFER:  { bg: '#FEF3C7', border: '#FBBF24', text: '#B45309' },
  CLOSED:  { bg: '#F1F5F9', border: '#E2E8F0', text: '#94A3B8' },
};

// ─── Slot Grid (identical logic to venue-detail) ────────────────────────────────

function SlotGrid({
  slots,
  selectedSlots,
  onToggle,
  loading,
  error,
  colors,
  selectedDate,
  now,
}: {
  slots: TimeSlot[];
  selectedSlots: TimeSlot[];
  onToggle: (slot: TimeSlot) => void;
  loading: boolean;
  error: string | null;
  colors: ThemeColors;
  selectedDate: string;
  now: Date;
}) {
  if (loading) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 24, justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary }}>
          Memuat jadwal...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center', gap: 8 }}>
        <MaterialIcons name="error-outline" size={32} color={colors.error} />
        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.error }}>{error}</Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
        <MaterialIcons name="event-busy" size={36} color={colors.textTertiary} />
        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 14, color: colors.textSecondary }}>
          Tidak ada slot tersedia. Coba pilih tanggal lain.
        </Text>
      </View>
    );
  }

  const currentDateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {slots.map((slot, i) => {
        const isAvailable = slot.status === 'AVAILABLE';
        const isPast = selectedDate === currentDateStr && slot.start_time < currentTimeStr;
        const isSelected = selectedSlots.some((s) => s.start_time === slot.start_time);
        const disabled = !isAvailable || isPast;
        const palette = SLOT_PALETTE[slot.status] ?? null;

        return (
          <TouchableOpacity
            key={i}
            activeOpacity={disabled ? 1 : 0.75}
            disabled={disabled}
            onPress={() => onToggle(slot)}
            style={[
              slotStyles.slotBtn,
              isSelected && slotStyles.slotBtnSelected,
              !isSelected && !disabled && { backgroundColor: colors.surfaceWhite ?? colors.surface, borderColor: colors.primary },
              !isSelected && disabled && slotStyles.slotBtnDisabled,
              !isSelected && !isAvailable && palette
                ? { backgroundColor: palette.bg, borderColor: palette.border }
                : null,
            ]}
          >
            <Text
              style={[
                slotStyles.slotTime,
                isSelected
                  ? { color: '#fff' }
                  : !disabled
                  ? { color: colors.primary }
                  : { color: palette?.text ?? colors.textTertiary },
              ]}
            >
              {slot.start_time}
            </Text>
            {isSelected ? (
              <Text style={[slotStyles.slotHint, { color: 'rgba(255,255,255,0.9)' }]}>Dipilih</Text>
            ) : isPast ? (
              <Text style={[slotStyles.slotHint, { color: colors.textTertiary }]}>Lewat</Text>
            ) : !isAvailable ? (
              <Text style={[slotStyles.slotHint, { color: palette?.text ?? colors.textTertiary }]}>
                {slot.status === 'BOOKED' ? 'Penuh' : slot.status === 'BUFFER' ? 'Buffer' : 'Tutup'}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const slotStyles = StyleSheet.create({
  slotBtn: {
    minWidth: 80,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  slotBtnSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  slotBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.55,
  },
  slotTime: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  slotHint: { fontFamily: FONT_FAMILY, fontSize: 10, marginTop: 2 },
});

// ─── Recent Transactions ────────────────────────────────────────────────────────

function RecentTransactions({ colors }: { colors: ThemeColors }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await apiFetch('/owner/bookings', { params: { page: 1 } });
      const data = await res.json();
      const list: Transaction[] = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      // Only show manual/walk-in (payment_method === 'cash' and created today or recently)
      setTxs(list.slice(0, 10));
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />;

  if (txs.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
        <MaterialIcons name="receipt-long" size={32} color={colors.textTertiary} />
        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary }}>
          Belum ada transaksi hari ini
        </Text>
      </View>
    );
  }

  return (
    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }}>
      <View style={{ gap: 10 }}>
        {txs.map((tx) => {
          const statusColor = tx.status === 'COMPLETED' ? '#10B981' : tx.status === 'CANCELLED' || tx.status === 'REJECTED' ? colors.error : colors.primary;
          return (
            <View
              key={tx.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.outline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="receipt" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                  {tx.customer_name || tx.user?.name || `Booking #${tx.id}`}
                </Text>
                <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, color: colors.textSecondary }}>
                  {tx.field?.name || '-'} · {tx.start_time}–{tx.end_time}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: colors.text }}>
                  {formatCurrency(tx.total_price)}
                </Text>
                <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: statusColor, fontWeight: '700' }}>
                  {tx.status}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </RefreshControl>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function OwnerKasirPage() {
  const { colors, resolved } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const isMobile = useIsMobileWeb();

  const now = useNow();

  // Fields
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [loadingFields, setLoadingFields] = useState(true);

  // Date
  const [date, setDate] = useState(getTodayStr());

  // Slots via useSlots hook (real-time polling like venue-detail)
  const { slotsData, loading: loadingSlots, error: slotsError } = useSlots(
    selectedField?.id ?? null,
    date,
    3000,
  );
  const slots: TimeSlot[] = slotsData?.slots ?? [];
  const closedDays: number[] = slotsData?.closed_days ?? [];
  const holidays: string[] = slotsData?.holidays ?? [];
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Transaction
  const [saving, setSaving] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<any>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  // Load fields on mount
  useEffect(() => {
    apiFetch('/fields/my/list')
      .then((r) => r.json())
      .then((data) => {
        const list: Field[] = Array.isArray(data?.data) ? data.data : [];
        setFields(list);
        if (list.length > 0) setSelectedField(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingFields(false));
  }, []);

  // Reset selected slots when field or date changes
  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedField?.id, date]);

  const handleToggleSlot = useCallback(
    (slot: TimeSlot) => {
      if (slot.status !== 'AVAILABLE') return;
      const exists = selectedSlots.some((s) => s.start_time === slot.start_time);
      if (exists) {
        setSelectedSlots((prev) => prev.filter((s) => s.start_time !== slot.start_time));
      } else {
        setSelectedSlots((prev) => [...prev, slot]);
      }
    },
    [selectedSlots]
  );

  // Calculate total
  const total = selectedSlots.reduce((sum, s) => {
    if (s.price != null) return sum + s.price;
    if (selectedField?.price_per_hour != null) {
      const dur = selectedField.session_duration_minutes ?? 60;
      return sum + (selectedField.price_per_hour * dur) / 60;
    }
    return sum;
  }, 0);

  const handleCheckout = async () => {
    if (!selectedField || selectedSlots.length === 0) {
      showToast({ type: 'error', title: 'Belum lengkap', description: 'Pilih lapangan dan minimal 1 slot jam.' });
      return;
    }
    if (!customerName.trim()) {
      showToast({ type: 'error', title: 'Nama pelanggan kosong', description: 'Masukkan nama pelanggan walk-in.' });
      return;
    }

    setSaving(true);
    try {
      const result = await createOwnerManualBooking({
        field_id: selectedField.id,
        booking_date: date,
        slots: selectedSlots.map((s) => ({ start_time: s.start_time, end_time: s.end_time })),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        payment_method: 'cash',
      });

      const booking = result?.data;
      setReceiptBooking({
        ...booking,
        customer_name: customerName.trim(),
        field: selectedField,
      });
      setReceiptVisible(true);

      // Reset form
      setSelectedSlots([]);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setTxRefreshKey((k) => k + 1);
    } catch (e: any) {
      showToast({ type: 'error', title: 'Gagal', description: e?.message || 'Transaksi gagal disimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const sortedSelectedSlots = [...selectedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <View style={[st.screen, { backgroundColor: colors.background }]}>
      <DashboardHeader
        title="Kasir Offline"
        subtitle="Transaksi walk-in langsung di tempat"
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={[st.content, !isMobile && { maxWidth: 1100, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[st.grid, !isMobile && { flexDirection: 'row', alignItems: 'flex-start', gap: 20 }]}>
          {/* ── Left: POS Form ── */}
          <View style={[st.leftCol, !isMobile && { flex: 1.2 }]}>

            {/* Section: Pilih Lapangan */}
            <SectionCard title="Pilih Lapangan" icon="stadium" colors={colors}>
              {loadingFields ? (
                <ActivityIndicator color={colors.primary} />
              ) : fields.length === 0 ? (
                <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary }}>
                  Belum ada lapangan terdaftar.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {fields.map((f) => {
                    const isActive = selectedField?.id === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => setSelectedField(f)}
                        activeOpacity={0.8}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: isActive ? colors.primary : colors.outline,
                          backgroundColor: isActive ? colors.primaryContainer : colors.surface,
                          alignItems: 'center',
                          minWidth: 100,
                        }}
                      >
                        <MaterialIcons name="stadium" size={18} color={isActive ? colors.primary : colors.textSecondary} />
                        <Text
                          style={{
                            fontFamily: FONT_FAMILY,
                            fontSize: 13,
                            fontWeight: '700',
                            color: isActive ? colors.primary : colors.text,
                            marginTop: 4,
                          }}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                        {f.price_per_hour != null && (
                          <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: isActive ? colors.primary : colors.textSecondary }}>
                            {formatCurrency(f.price_per_hour)}/jam
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </SectionCard>

            {/* Section: Pilih Tanggal — sama persis dengan venue-detail */}
            <SectionCard title="Tanggal Bermain" icon="event" colors={colors}>
              <HorizontalDatePicker
                value={date}
                onChange={(iso) => setDate(iso)}
                closedDays={closedDays}
                holidays={holidays}
              />
            </SectionCard>

            {/* Section: Pilih Slot Jam — sama persis dengan venue-detail */}
            <SectionCard title="Pilih Slot Jam" icon="schedule" colors={colors}>
              {/* Legend */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 10, marginBottom: 14 }}>
                {[
                  { color: colors.primary, label: 'Tersedia' },
                  { color: colors.primary, label: 'Dipilih', solid: true },
                  { color: '#DC2626', label: 'Penuh' },
                  { color: colors.textTertiary, label: 'Lewat/Tutup' },
                ].map((l) => (
                  <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.solid ? l.color : 'transparent', borderWidth: 2, borderColor: l.color }} />
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: colors.textSecondary }}>{l.label}</Text>
                  </View>
                ))}
              </View>
              <SlotGrid
                slots={slots}
                selectedSlots={selectedSlots}
                onToggle={handleToggleSlot}
                loading={loadingSlots}
                error={slotsError}
                colors={colors}
                selectedDate={date}
                now={now}
              />
              {selectedSlots.length > 0 && (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, color: colors.textSecondary, width: '100%' }}>
                    Slot dipilih ({selectedSlots.length}):
                  </Text>
                  {sortedSelectedSlots.map((s) => (
                    <View
                      key={s.start_time}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: colors.primary + '15',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, color: colors.primary, fontWeight: '700' }}>
                        {s.start_time}–{s.end_time}
                      </Text>
                      <TouchableOpacity onPress={() => handleToggleSlot(s)}>
                        <MaterialIcons name="close" size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

            {/* Section: Data Pelanggan */}
            <SectionCard title="Data Pelanggan (Walk-in)" icon="person" colors={colors}>
              <Text style={[st.inputLabel, { color: colors.textSecondary }]}>Nama Pelanggan *</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Contoh: Pak Budi / Tim Garuda"
                placeholderTextColor={colors.textTertiary}
                style={[st.input, { borderColor: colors.outline, color: colors.text, backgroundColor: colors.surfaceContainerLow }]}
              />

              <Text style={[st.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>Nomor HP (Opsional)</Text>
              <TextInput
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="08123456789"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                style={[st.input, { borderColor: colors.outline, color: colors.text, backgroundColor: colors.surfaceContainerLow }]}
              />

              <Text style={[st.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>Catatan (Opsional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Contoh: bayar nanti, bonus 1 jam, dll"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                style={[st.input, { borderColor: colors.outline, color: colors.text, backgroundColor: colors.surfaceContainerLow, height: 68, textAlignVertical: 'top' }]}
              />
            </SectionCard>
          </View>

          {/* ── Right: Summary + Checkout ── */}
          <View style={[st.rightCol, !isMobile && { flex: 0.8 }]}>

            {/* Order Summary */}
            <SectionCard title="Ringkasan Pesanan" icon="shopping-cart" colors={colors}>
              {selectedField ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <MaterialIcons name="stadium" size={16} color={colors.primary} />
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }}>
                      {selectedField.name}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <MaterialIcons name="event" size={14} color={colors.textSecondary} />
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary }}>
                      {formatDateDisplay(date)}
                    </Text>
                  </View>

                  {selectedSlots.length === 0 ? (
                    <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 10, padding: 14, alignItems: 'center' }}>
                      <MaterialIcons name="touch-app" size={24} color={colors.textTertiary} />
                      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                        Pilih slot jam dari grid di kiri
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8, marginBottom: 16 }}>
                      {sortedSelectedSlots.map((s) => (
                        <View
                          key={s.start_time}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: colors.surfaceContainerLow,
                            borderRadius: 10,
                            padding: 12,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialIcons name="schedule" size={14} color={colors.primary} />
                            <Text style={{ fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600', color: colors.text }}>
                              {s.start_time} – {s.end_time}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: colors.text }}>
                            {s.price != null
                              ? formatCurrency(s.price)
                              : selectedField.price_per_hour != null
                              ? formatCurrency((selectedField.price_per_hour * (selectedField.session_duration_minutes ?? 60)) / 60)
                              : '-'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: colors.outline, marginVertical: 4 }} />

                  {/* Total */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: colors.text }}>
                      Total
                    </Text>
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '900', color: colors.primary }}>
                      {total > 0 ? formatCurrency(total) : '-'}
                    </Text>
                  </View>

                  {/* Payment method badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10, marginBottom: 16 }}>
                    <MaterialIcons name="payments" size={18} color="#059669" />
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: '#059669' }}>
                      Cash · Bayar di Kasir
                    </Text>
                  </View>

                  {/* Checkout Button */}
                  <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={saving || selectedSlots.length === 0 || !customerName.trim()}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 16,
                      borderRadius: 14,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: saving || selectedSlots.length === 0 || !customerName.trim() ? 0.5 : 1,
                      ...(Platform.OS === 'web' ? { boxShadow: `0 4px 16px ${colors.primary}50` } : {}),
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="point-of-sale" size={20} color="#fff" />
                        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: '#fff' }}>
                          Proses Transaksi
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <MaterialIcons name="stadium" size={32} color={colors.textTertiary} />
                  <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                    Pilih lapangan terlebih dahulu
                  </Text>
                </View>
              )}
            </SectionCard>

            {/* Recent Transactions */}
            <SectionCard title="Transaksi Terakhir" icon="history" colors={colors}>
              <RecentTransactions key={txRefreshKey} colors={colors} />
            </SectionCard>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <ReceiptModal
        visible={receiptVisible}
        onClose={() => setReceiptVisible(false)}
        booking={receiptBooking}
        colors={colors}
      />
    </View>
  );
}

// ─── Section Card Helper ────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  colors,
  children,
}: {
  title: string;
  icon: string;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.outline,
        ...SHADOWS.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryContainer, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name={icon as any} size={17} color={colors.primary} />
        </View>
        <Text style={{ fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: colors.text }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SIZES.gutter, paddingBottom: 40 },
  grid: { gap: 0 },
  leftCol: {},
  rightCol: {},
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
});
