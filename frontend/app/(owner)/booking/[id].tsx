// frontend/app/(owner)/booking/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { Card, Button, Loading, ErrorState } from '../../../components/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getBooking,
  ownerApproveBooking,
  ownerRejectBooking,
  cancelBooking,
  Booking,
} from '../../../services/bookingService';
import { useProfileStore } from '../../../store/profileStore';

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

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      const res = await getBooking(Number(id));
      setBooking(res.data);
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat detail booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

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

  const handleOwnerReject = async () => {
    if (!booking) return;
    Alert.prompt('Alasan Penolakan', 'Masukkan alasan penolakan (opsional)', async reason => {
      try {
        await ownerRejectBooking(booking.id, reason);
        Alert.alert('Berhasil', 'Booking ditolak');
        fetchDetail();
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Gagal menolak booking');
      }
    });
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

  const isOwner = profile?.role === 'owner' && booking.field?.owner_id === profile?.user_id;
  const isPlayer = profile?.role === 'player' && booking.user_id === profile?.user_id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Detail Booking</Text>
        <Text>{`Lapangan: ${booking.field?.name ?? 'Tidak diketahui'}`}</Text>
        <Text>{`Tanggal: ${booking.booking_date}`}</Text>
        <Text>{`Jam: ${booking.start_time} – ${booking.end_time}`}</Text>
        <Text>{`Durasi: ${booking.duration_minutes} menit`}</Text>
        <Text>{`Total Harga: Rp ${booking.total_price?.toLocaleString()}`}</Text>
        <Text style={[styles.status, { color: statusColor(booking.status) }]}>{booking.status}</Text>
      </Card>

      {/* Action Buttons based on role & status */}
      <View style={styles.actions}>
        {isPlayer && booking.status === 'WAITING_CONFIRMATION' && (
          <Button title="Batalkan" onPress={handleCancel} variant="secondary" />
        )}
        {isOwner && booking.status === 'WAITING_CONFIRMATION' && (
          <>
            <Button title="Terima" onPress={handleOwnerApprove} variant="primary" />
            <Button title="Tolak" onPress={handleOwnerReject} variant="secondary" />
          </>
        )}
      </View>
    </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
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
