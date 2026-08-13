import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import DashboardHeader from '../../components/shared/DashboardHeader';
import BookingList from '../../components/BookingList';

export default function OwnerDashboard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DashboardHeader
        title="Dashboard Owner"
        subtitle="Kelola booking lapangan Anda"
        showBack={false}
      />
      <BookingList role="owner" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
