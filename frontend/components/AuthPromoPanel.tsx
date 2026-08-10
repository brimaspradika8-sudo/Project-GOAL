import React from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const AUTH_BG_IMAGE = 'https://images.unsplash.com/photo-1595169043775-1612bf911b0f?w=1200&h=1400&fit=crop&auto=format';

const sports = [
  { icon: 'sports-soccer' as const, label: 'Futsal' },
  { icon: 'sports-tennis' as const, label: 'Badminton' },
  { icon: 'sports-basketball' as const, label: 'Basketball' },
  { icon: 'sports-tennis' as const, label: 'Padel' },
  { icon: 'sports-volleyball' as const, label: 'Volleyball' },
];

export default function AuthPromoPanel() {
  const { width, height } = useWindowDimensions();
  const scale = Math.max(0.78, Math.min(1.08, Math.min(width / 1440, height / 900)));

  return (
    <View style={styles.panel}>
      <Image source={{ uri: AUTH_BG_IMAGE }} style={styles.image} resizeMode="cover" />
      <LinearGradient colors={['rgba(4, 32, 17, 0.55)', 'rgba(5, 45, 24, 0.78)']} style={[styles.overlay, { padding: 28 * scale }]}>
        <View style={[styles.brandRow, { gap: 10 * scale }]}>
          <View style={[styles.logo, { width: 40 * scale, height: 40 * scale, borderRadius: 20 * scale }]}><MaterialIcons name="sports-soccer" size={22 * scale} color="#FFFFFF" /></View>
          <Text style={[styles.brand, { fontSize: 18 * scale }]}>GOAL</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { fontSize: 12 * scale, marginBottom: 18 * scale }]}>2,400+ venues available</Text>
          <Text style={[styles.title, { fontSize: 42 * scale, lineHeight: 46 * scale }]}>Find &amp; Book{`\n`}<Text style={styles.titleAccent}>Sports Venues</Text>{`\n`}Near You</Text>
          <Text style={[styles.description, { fontSize: 15 * scale, lineHeight: 23 * scale, marginTop: 18 * scale }]}>From futsal to padel, discover, compare, and book premium sports facilities in seconds.</Text>
          <View style={[styles.chips, { gap: 8 * scale, marginTop: 22 * scale }]}>
            {sports.map((sport) => (
              <View key={sport.label} style={[styles.chip, { gap: 5 * scale, borderRadius: 18 * scale, paddingHorizontal: 11 * scale, paddingVertical: 8 * scale }]}>
                <MaterialIcons name={sport.icon} size={14 * scale} color="#D1FAE5" />
                <Text style={[styles.chipText, { fontSize: 11 * scale }]}>{sport.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.stats, { gap: 34 * scale }]}>
          <View><Text style={[styles.statValue, { fontSize: 18 * scale }]}>2,400+</Text><Text style={[styles.statLabel, { fontSize: 10 * scale }]}>Venues</Text></View>
          <View><Text style={[styles.statValue, { fontSize: 18 * scale }]}>18K+</Text><Text style={[styles.statLabel, { fontSize: 10 * scale }]}>Players</Text></View>
          <View><Text style={[styles.statValue, { fontSize: 18 * scale }]}>4.9x</Text><Text style={[styles.statLabel, { fontSize: 10 * scale }]}>Rating</Text></View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '50%',
    flexShrink: 0,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#0a1a10',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } as any : {}),
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, flex: 1, padding: 28, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  brand: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  copy: { maxWidth: 430 },
  eyebrow: { color: '#A7F3D0', fontSize: 12, fontWeight: '800', marginBottom: 18 },
  title: { color: '#FFFFFF', fontSize: 42, lineHeight: 46, fontWeight: '900' },
  titleAccent: { color: '#10B981' },
  description: { color: '#D1FAE5', fontSize: 15, lineHeight: 23, marginTop: 18, maxWidth: 360 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167, 243, 208, 0.35)', backgroundColor: 'rgba(6, 78, 59, 0.55)', paddingHorizontal: 11, paddingVertical: 8 },
  chipText: { color: '#ECFDF5', fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 34 },
  statValue: { color: '#10B981', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#A7F3D0', fontSize: 10, marginTop: 3 },
});
