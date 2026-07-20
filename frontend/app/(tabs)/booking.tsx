import React from 'react';
import {
  StyleSheet, View, Text, Platform, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../components/goalTheme';
import { FadeInView } from '../../components/FadeInView';

export default function BookingTabScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FadeInView style={styles.center}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="confirmation-number" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Booking</Text>
        <Text style={styles.badge}>Segera Hadir</Text>
        <Text style={styles.desc}>
          Fitur pemesanan lapangan sedang kami kembangkan.{'\n'}
          Nantikan pembaruan berikutnya!
        </Text>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer ?? '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...FONTS.headlineLg,
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryContainer ?? '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  desc: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
