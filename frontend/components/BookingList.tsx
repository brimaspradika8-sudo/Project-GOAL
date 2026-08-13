// frontend/components/BookingList.tsx

import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Pressable, Text } from 'react-native';
import { Card, Button, Loading, ErrorState } from './common';
import { getMyBookings, getOwnerBookings, Booking, BookingHistoryResponse } from '../services/bookingService';

/**
 * BookingList component – menampilkan daftar booking sesuai peran pengguna.
 *   • Player: memanggil getMyBookings()
 *   • Owner : memanggil getOwnerBookings()
 *   • Admin : memanggil getAdminBookings()
 *
 * Props:
 *   - role: 'player' | 'owner' | 'admin'
 *   - onSelect?: (booking: Booking) => void   // callback ketika user menekan item
 */
interface BookingListProps {
  role: 'player' | 'owner' | 'admin';
  onSelect?: (booking: Booking) => void;
}

export const BookingList: React.FC<BookingListProps> = ({ role, onSelect }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPage = async (pageNumber: number) => {
    try {
      let response: BookingHistoryResponse;
      switch (role) {
        case 'owner':
          response = await getOwnerBookings(pageNumber);
          break;
        default:
          response = await getMyBookings(pageNumber);
      }
      const newData = response.data;
      setBookings(prev => (pageNumber === 1 ? newData : [...prev, ...newData]));
      setHasMore(pageNumber < response.pagination.last_page);
    } catch (e: any) {
      setError(e.message ?? 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPage(1);
  }, [role]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage);
  };

  const onRefresh = () => {
    setPage(1);
    setLoading(true);
    fetchPage(1);
  };

  if (loading && page === 1) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRefresh} />;
  }

  const renderItem = ({ item }: { item: Booking }) => {
    const statusColor = {
      WAITING_OWNER_APPROVAL: '#ffb400',
      APPROVED: '#4caf50',
      WAITING_PAYMENT: '#ff9800',
      CONFIRMED: '#2196f3',
      COMPLETED: '#9c27b0',
      REJECTED: '#f44336',
      CANCELLED: '#f44336',
      EXPIRED: '#607d8b',
    }[item.status] as string;

    return (
      <Pressable onPress={() => onSelect?.(item)}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>Lapangan: {item.field?.name ?? 'Tidak diketahui'}</Text>
            <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
          </View>
          <Text>{`Tanggal: ${item.booking_date}`}</Text>
          <Text>{`Jam: ${item.start_time} – ${item.end_time}`}</Text>
          <Text>{`Harga: Rp ${item.total_price?.toLocaleString()}`}</Text>
          {role === 'owner' && (
            <View style={styles.actions}>
              <Button
                title="Setujui"
                onPress={() => {
                  // call ownerApproveBooking, then refresh list
                  // you can import the function directly here
                }}
                variant="primary"
              />
              <Button
                title="Tolak"
                onPress={() => {
                  // call ownerRejectBooking with optional reason
                }}
                variant="secondary"
              />
            </View>
          )}
        </Card>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={bookings}
      keyExtractor={item => item.id.toString()}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={hasMore ? <Loading /> : null}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  card: {
    marginBottom: 12,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
});

export default BookingList;
