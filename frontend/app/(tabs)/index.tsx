import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Easing, RefreshControl, Alert,
  Image, Platform, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
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

export default function HomeScreen() {
  const { profile, loading, fetchProfile } = useProfileStore();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const hydrateHome = async () => {
      if (!profile) {
        await fetchProfile();
      }
    };

    hydrateHome();
  }, []);

  useEffect(() => {
    if (!loading && profile) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar akun?')) {
        try {
          supabase.auth.signOut();
        } catch (e) {
          window.alert('Terjadi kesalahan saat sign out.');
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
          } catch (e) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat sign out.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} colors={[GREEN]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Selamat datang,</Text>
              <Text style={styles.username}>{profile?.full_name ?? profile?.username ?? 'Pengguna'}</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <MaterialIcons name="logout" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=131313' }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name ?? profile?.username ?? 'Pengguna'}</Text>
              {profile?.username ? (
                <Text style={styles.profileHandle}>@{profile.username}</Text>
              ) : null}
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={14} color={MUTED} />
                <Text style={styles.locationText}>{profile?.region ?? 'Belum diatur'}</Text>
              </View>
            </View>
          </View>

          {/* Sports Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Olahraga Saya</Text>
            {profile?.sports && profile.sports.length > 0 ? (
              <View style={styles.sportsGrid}>
                {profile.sports.map((sport) => (
                  <View key={sport} style={styles.sportChip}>
                    <MaterialIcons
                      name={(SPORT_ICONS[sport] ?? 'sports') as any}
                      size={16}
                      color={GREEN}
                    />
                    <Text style={styles.sportLabel}>{sport.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Belum ada olahraga dipilih</Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(75,226,119,0.12)' }]}>
                  <MaterialIcons name="sports" size={24} color={GREEN} />
                </View>
                <Text style={styles.actionLabel}>Cari Pertandingan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                  <MaterialIcons name="groups" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.actionLabel}>Tim Saya</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
                  <MaterialIcons name="stadium" size={24} color="#fbbf24" />
                </View>
                <Text style={styles.actionLabel}>Lapangan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(168,85,247,0.12)' }]}>
                  <MaterialIcons name="leaderboard" size={24} color="#a855f7" />
                </View>
                <Text style={styles.actionLabel}>Peringkat</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Match Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pertandingan Mendatang</Text>
            <View style={styles.emptyCard}>
              <MaterialIcons name="event-busy" size={40} color={CARD_BORDER} />
              <Text style={styles.emptyCardTitle}>Belum ada pertandingan</Text>
              <Text style={styles.emptyCardDesc}>Buat atau cari pertandingan untuk memulai.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  centered: {
    flex: 1,
    backgroundColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 15,
    color: MUTED,
    fontWeight: '500',
  },
  username: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  signOutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    marginBottom: 28,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: DARK2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileHandle: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: MUTED,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  emptyCardDesc: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
  },
});
