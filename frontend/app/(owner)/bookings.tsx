import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="receipt-long" size={40} color="#1E8A4C" />
        </View>
        <Text style={styles.title}>Daftar Booking</Text>
        <View style={styles.badgeWrap}>
          <Text style={styles.badge}>SEGERA HADIR</Text>
        </View>
        <Text style={styles.desc}>
          Fitur pengelolaan reservasi dari penyewa{'\n'}
          sedang dalam pengembangan. Nantikan segera!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d14' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 36,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  iconWrap: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: 'rgba(74,222,128,0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#f8fafc',
    marginBottom: 12, textAlign: 'center',
  },
  badgeWrap: { marginBottom: 16 },
  badge: {
    fontSize: 11, fontWeight: '800', color: '#4ade80',
    backgroundColor: 'rgba(74,222,128,0.15)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, overflow: 'hidden',
    letterSpacing: 1.5,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
  },
  desc: {
    fontSize: 14, color: '#64748b',
    textAlign: 'center', lineHeight: 22,
  },
});
