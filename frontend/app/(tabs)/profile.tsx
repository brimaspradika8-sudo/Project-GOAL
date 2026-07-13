import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, Platform, StatusBar, Alert, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';

const GREEN = '#4be277';
const DARK = '#131313';
const DARK2 = '#1a2e1f';
const CARD = '#1a2e1f';
const CARD_BORDER = '#263d2c';
const MUTED = '#627369';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  minisoccer: 'sports-soccer',
  tennis: 'sports-tennis',
  tabletennis: 'sports',
  others: 'more-horiz',
};

export default function ProfileScreen() {
  const { profile, clearProfile } = useProfileStore();
  const [fullName, setFullName] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loadName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user?.user_metadata?.full_name;
      if (name) setFullName(name);
    };
    loadName();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar akun?')) {
        try {
          supabase.auth.signOut();
          clearProfile();
        } catch (e) {
          window.alert('Terjadi kesalahan saat keluar akun.');
        }
      }
      return;
    }
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            clearProfile();
          } catch (e) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat keluar akun.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Profil</Text>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=131313' }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName ?? profile?.full_name ?? profile?.username ?? 'Pengguna'}</Text>
              {profile?.username ? (
                <Text style={styles.profileHandle}>@{profile.username}</Text>
              ) : null}
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={14} color={MUTED} />
                <Text style={styles.locationText}>{profile?.region ?? 'Belum diatur'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => router.push('/onboarding')}>
              <MaterialIcons name="edit" size={18} color={GREEN} />
            </TouchableOpacity>
          </View>

          {/* Sports */}
          <Text style={styles.sectionTitle}>OLAHRAGA</Text>
          <View style={styles.sportsRow}>
            {profile?.sports && profile.sports.length > 0 ? (
              profile.sports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <MaterialIcons name={(SPORT_ICONS[sport] ?? 'sports') as any} size={14} color={GREEN} />
                  <Text style={styles.sportLabel}>{sport.toUpperCase()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Belum ada preferensi olahraga</Text>
            )}
          </View>

          {/* Menu Items */}
          <Text style={styles.sectionTitle}>PENGATURAN</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <MaterialIcons name="person-outline" size={20} color={MUTED} />
              <Text style={styles.menuLabel}>Ubah Profil</Text>
              <MaterialIcons name="chevron-right" size={20} color={MUTED} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <MaterialIcons name="notifications-none" size={20} color={MUTED} />
              <Text style={styles.menuLabel}>Notifikasi</Text>
              <MaterialIcons name="chevron-right" size={20} color={MUTED} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <MaterialIcons name="lock-outline" size={20} color={MUTED} />
              <Text style={styles.menuLabel}>Ubah Kata Sandi</Text>
              <MaterialIcons name="chevron-right" size={20} color={MUTED} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <MaterialIcons name="help-outline" size={20} color={MUTED} />
              <Text style={styles.menuLabel}>Pusat Bantuan</Text>
              <MaterialIcons name="chevron-right" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={20} color="#f43f5e" />
            <Text style={styles.signOutText}>Keluar Akun</Text>
          </TouchableOpacity>

          <Text style={styles.version}>GOAL v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.3, marginBottom: 24 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1,
    borderColor: CARD_BORDER, padding: 16, marginBottom: 28, gap: 14,
  },
  avatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: DARK2 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 4 },
  profileHandle: { fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: MUTED },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(75,226,119,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: MUTED,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
  },
  sportsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: CARD, borderRadius: 10, borderWidth: 1,
    borderColor: CARD_BORDER, paddingHorizontal: 12, paddingVertical: 8,
  },
  sportLabel: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  emptyText: { fontSize: 13, color: MUTED },
  menuCard: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1,
    borderColor: CARD_BORDER, marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#fff' },
  menuDivider: { height: 1, backgroundColor: CARD_BORDER, marginHorizontal: 16 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(244,63,94,0.1)',
    borderRadius: 12, paddingVertical: 14, borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)', marginBottom: 20,
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: '#f43f5e' },
  version: { fontSize: 12, color: MUTED, textAlign: 'center' },
});
