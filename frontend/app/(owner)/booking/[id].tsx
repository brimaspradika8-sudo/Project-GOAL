// frontend/app/(owner)/booking/[id].tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, Text, Modal, TextInput,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Card, Button, Loading, ErrorState } from '../../../components/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getBooking,
  ownerApproveBooking,
  ownerRejectBooking,
  cancelBooking,
  type Booking,
} from '../../../services/bookingService';
import { useProfileStore } from '../../../store/profileStore';
import { useTheme } from '../../../lib/theme';
import { useIsMobileWeb } from '../../../lib/responsive';

function RejectModal({
  visible,
  onClose,
  onConfirm,
  loading,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[mStyles.overlay]}>
        <View style={[mStyles.sheet, { backgroundColor: colors.surfaceWhite ?? colors.surface }]}>
          <Text style={[mStyles.title, { color: colors.text }]}>Tolak Booking</Text>
          <Text style={[mStyles.subtitle, { color: colors.textSecondary }]}>
            Berikan alasan penolakan (opsional) agar penyewa dapat memahami keputusan Anda.
          </Text>
          <TextInput
            style={[mStyles.input, { borderColor: colors.outline ?? colors.divider, color: colors.text, backgroundColor: colors.surfaceContainer }]}
            placeholder="Contoh: Lapangan sudah penuh di jam tersebut"
            placeholderTextColor={colors.textTertiary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          <View style={mStyles.btnRow}>
            <TouchableOpacity
              style={[mStyles.cancelBtn, { borderColor: colors.outline ?? colors.divider }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[mStyles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mStyles.confirmBtn, { backgroundColor: colors.error }]}
              onPress={() => onConfirm(reason)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={mStyles.confirmBtnText}>Tolak Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 20,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

/**
 * BookingDetailScreen – menampilkan detail pemesanan dan aksi yang relevan
 *   • Player: dapat membatalkan saat status masih WAITING_CONFIRMATION.
 *   • Owner: dapat menyetujui atau menolak ketika status = WAITING_CONFIRMATION.
 *   • Admin: hanya melihat (tidak ada aksi khusus di layar ini).
 */

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const { colors } = useTheme();
  const isMobile = useIsMobileWeb();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await getBooking(Number(id));
      setBooking(res.data);
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat detail booking');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleOwnerApprove = async () => {
    if (!booking) return;
    try {
      await ownerApproveBooking(booking.id);
      Alert.alert('Berhasil', 'Booking disetujui');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Gagal menyetujui booking');
    }
  };

  const handleOwnerRejectConfirm = async (reason: string) => {
    if (!booking) return;
    setRejecting(true);
    try {
      await ownerRejectBooking(booking.id, reason);
      setRejectVisible(false);
      Alert.alert('Berhasil', 'Booking ditolak');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Gagal menolak booking');
    } finally {
      setRejecting(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin membatalkan booking?', [
      { text: 'Tidak' },
      {
        text: 'Ya',
        onPress: async () => {
          try {
            await cancelBooking(booking.id, 'Dibatalkan oleh pengguna');
            Alert.alert('Berhasil', 'Booking dibatalkan');
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Gagal membatalkan booking');
          }
        },
      },
    ]);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState description={error} onRetry={fetchDetail} />;
  if (!booking) return null;

  const st = makeStyles(isMobile);
  const isOwner = profile?.role === 'owner' && booking.field?.owner_id === profile?.user_id;
  const isPlayer = profile?.role === 'player' && booking.user_id === profile?.user_id;

  return (
    <View style={[st.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={st.container}>
        <Card style={st.card}>
          <Text style={[st.title, { color: colors.text }]}>Detail Booking</Text>
          <Text style={[st.rowText, { color: colors.textSecondary }]}>
            {`Lapangan: ${booking.field?.name ?? 'Tidak diketahui'}`}
          </Text>
          <Text style={[st.rowText, { color: colors.textSecondary }]}>
            {`Tanggal: ${booking.booking_date}`}
          </Text>
          <Text style={[st.rowText, { color: colors.textSecondary }]}>
            {`Jam: ${booking.start_time} – ${booking.end_time}`}
          </Text>
          <Text style={[st.rowText, { color: colors.textSecondary }]}>
            {`Durasi: ${booking.duration_minutes} menit`}
          </Text>
          <Text style={[st.rowText, { color: colors.textSecondary }]}>
            {`Total Harga: Rp ${booking.total_price?.toLocaleString()}`}
          </Text>
          <Text style={[st.status, { color: statusColor(booking.status) }]}>{booking.status}</Text>
        </Card>

        {/* Action Buttons based on role & status */}
        <View style={st.actions}>
          {isPlayer && booking.status === 'WAITING_CONFIRMATION' && (
            <Button title="Batalkan" onPress={handleCancel} variant="secondary" />
          )}
          {isOwner && booking.status === 'WAITING_CONFIRMATION' && (
            <>
              <Button title="Terima" onPress={handleOwnerApprove} variant="primary" />
              <Button title="Tolak" onPress={() => setRejectVisible(true)} variant="secondary" />
            </>
          )}
        </View>
      </ScrollView>

      <RejectModal
        visible={rejectVisible}
        onClose={() => setRejectVisible(false)}
        onConfirm={handleOwnerRejectConfirm}
        loading={rejecting}
        colors={colors}
      />
    </View>
  );
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    WAITING_CONFIRMATION: '#ffb400',
    CONFIRMED: '#2196f3',
    COMPLETED: '#9c27b0',
    REJECTED: '#f44336',
    CANCELLED: '#f44336',
    EXPIRED: '#607d8b',
  };
  return map[status] ?? '#000';
}

const makeStyles = (isMobile: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
    ...(isMobile ? {} : { maxWidth: 700, alignSelf: 'center', width: '100%', paddingTop: 32 }),
  },
  card: {
    padding: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowText: {
    fontSize: 14,
    marginBottom: 4,
  },
  status: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    gap: 8,
  },
});
