import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SHADOWS, FONT_FAMILY } from '../goalTheme';
import { SafeImage } from '../SafeImage';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import type { Booking, BookingStatus } from '../../services/bookingService';
import { SPORT_LABELS } from '../../lib/fieldValidation';
import { BookingStatusBadge } from './BookingStatusBadge';
import { formatCurrency } from '../../lib/format';

export const formatPrice = formatCurrency;

export function formatDateDisplay(d: string): string {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isCancelableBooking(status: BookingStatus): boolean {
  return status === 'WAITING_CONFIRMATION';
}

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onDoubleClick?: () => void;
  onCancel?: () => void;
}

export function BookingCard({
  booking,
  onPress,
  selectable = false,
  selected = false,
  onToggleSelect,
  onDoubleClick,
  onCancel,
}: BookingCardProps) {
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = makeStyles(colors, isMobile);

  const sportLabel = SPORT_LABELS[booking.field?.sport_type ?? ''] ?? (booking.field?.sport_type ?? '');
  const imageUri = booking.field?.image_url ?? '';
  const cancelable = isCancelableBooking(booking.status);
  const inSelection = selectable;

  const lastPressRef = useRef(0);

  const handlePress = () => {
    if (selectable) {
      onToggleSelect?.();
      return;
    }
    const now = Date.now();
    if (now - lastPressRef.current < 300) {
      lastPressRef.current = 0;
      onDoubleClick?.();
      return;
    }
    lastPressRef.current = now;
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [st.card, pressed && st.cardPressed]}
      onPress={handlePress}
    >
      {inSelection ? (
        <View style={st.imageWrap}>
          <SafeImage source={{ uri: imageUri }} style={st.image} fallbackSize={32} />
          <View style={[st.checkbox, selected && st.checkboxChecked]}>
            {selected ? <MaterialIcons name="check" size={14} color={colors.onPrimary} /> : null}
          </View>
        </View>
      ) : (
        <View style={st.imageWrap}>
          <SafeImage source={{ uri: imageUri }} style={st.image} fallbackSize={32} />
        </View>
      )}

      {isMobile ? (
        <View style={st.body}>
          <BookingStatusBadge status={booking.status} reason={booking.cancel_reason} />

          {booking.status === 'WAITING_CONFIRMATION' && !!booking.payment_expired_at && (
            <View style={[st.countdownBox, { backgroundColor: colors.warningMuted }]}>
              <MaterialIcons name="timer" size={13} color={colors.warning} />
              <Text style={[st.countdownText, { color: colors.warning }]}>
                Batas waktu bayar: {new Date(booking.payment_expired_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}

          <Text style={st.fieldName} numberOfLines={1}>
            {booking.field?.name ?? `Lapangan #${booking.field_id}`}
          </Text>
          {!!sportLabel && <Text style={st.sport} numberOfLines={1}>{sportLabel}</Text>}

          <View style={st.metaCol}>
            <View style={st.metaRow}>
              <MaterialIcons name="event" size={13} color={colors.primary} />
              <Text style={st.metaTextBold}>{formatDateDisplay(booking.booking_date)}</Text>
            </View>
            <View style={st.metaRow}>
              <MaterialIcons name="schedule" size={13} color={colors.primary} />
              <Text style={st.metaTextBold}>{booking.start_time} – {booking.end_time}</Text>
            </View>
          </View>

          <View style={st.footer}>
            <View style={st.priceWrap}>
              <Text style={st.priceLabel}>Total Bayar</Text>
              <Text style={st.price}>{formatPrice(booking.total_price)}</Text>
            </View>
            {!inSelection && (
              <View style={st.footerActions}>
                {cancelable && onCancel && (
                  <TouchableOpacity style={st.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                    <Text style={st.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                )}
                {onPress && (
                  <TouchableOpacity
                    style={[st.detailBtn, booking.status === 'WAITING_CONFIRMATION' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={onPress}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={booking.status === 'WAITING_CONFIRMATION' ? 'payment' : 'qr-code-2'}
                      size={14}
                      color={booking.status === 'WAITING_CONFIRMATION' ? colors.onPrimary : colors.primary}
                    />
                    <Text style={[st.detailBtnText, booking.status === 'WAITING_CONFIRMATION' && { color: colors.onPrimary }]}>
                      {booking.status === 'WAITING_CONFIRMATION' ? 'Bayar Now' : 'E-Tiket'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={st.desktopBody}>
          <View style={st.desktopDetailCol}>
            <Text style={st.fieldName} numberOfLines={1}>
              {booking.field?.name ?? `Lapangan #${booking.field_id}`}
            </Text>
            {!!sportLabel && <Text style={st.sport} numberOfLines={1}>{sportLabel}</Text>}
            <View style={st.metaCol}>
              <View style={st.metaRow}>
                <MaterialIcons name="event" size={13} color={colors.textTertiary} />
                <Text style={st.metaText}>{formatDateDisplay(booking.booking_date)}</Text>
              </View>
              <View style={st.metaRow}>
                <MaterialIcons name="schedule" size={13} color={colors.textTertiary} />
                <Text style={st.metaText}>{booking.start_time} – {booking.end_time}</Text>
              </View>
            </View>
          </View>

          <View style={st.desktopStatusCol}>
            <BookingStatusBadge status={booking.status} reason={booking.cancel_reason} />
          </View>

          <View style={st.desktopActionCol}>
            <Text style={st.priceDesktop}>{formatPrice(booking.total_price)}</Text>
            {!inSelection && (
              <View style={st.desktopBtnRow}>
                {cancelable && onCancel && (
                  <TouchableOpacity style={st.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                    <Text style={st.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                )}
                {onPress && (
                  <TouchableOpacity style={st.detailBtn} onPress={onPress} activeOpacity={0.8}>
                    <Text style={st.detailBtnText}>Lihat Detail</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isMobile: boolean) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    ...SHADOWS.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  imageWrap: {
    width: isMobile ? 108 : 176,
  },
  image: {
    width: isMobile ? 108 : 176,
    height: '100%',
    minHeight: isMobile ? 150 : 168,
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.surfaceWhite,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  desktopBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  desktopDetailCol: {
    flex: 1.5,
    gap: 4,
  },
  desktopStatusCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    minWidth: 140,
  },
  desktopBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  sport: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaCol: { gap: 3, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    gap: 8,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingRight: 14,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  price: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  priceDesktop: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  countdownText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  metaTextBold: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  priceWrap: {
    gap: 1,
  },
  priceLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  detailBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
});
