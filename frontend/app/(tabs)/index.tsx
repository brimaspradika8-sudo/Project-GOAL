import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert,
  Image, Platform, StatusBar, Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useProfileStore } from '../../store/profileStore';
import Animated, { FadeInDown, FadeInUp, ZoomIn, FadeInRight } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

const GREEN = '#4be277';
const DARK = '#0d110f';
const CARD = '#161f19';
const CARD_LIGHT = '#1e2b22';
const CARD_BORDER = '#25382c';
const MUTED = '#7d9484';
const TEXT_LIGHT = '#f0f5f2';
const PRIMARY_RED = '#b21c27'; // To match the image's red bar if desired, but we'll use dark theme for consistency
const FLOATING_BG = '#1a1423'; // Darker contrasting tone for the bar, or just use PRIMARY_RED

export default function HomeScreen() {
  const { profile, loading, fetchProfile, clearProfile } = useProfileStore();
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const hydrateHome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user?.user_metadata?.full_name;
      if (name) setDisplayName(name);

      if (!profile) {
        await fetchProfile();
      }
    };

    hydrateHome();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const userName = displayName ?? profile?.full_name ?? profile?.username ?? 'Pengguna';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} colors={[GREEN]} />
        }
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HERO SECTION WITH VIDEO */}
        <View style={styles.heroBackground}>
          <Video
            source={{ uri: 'https://youtu.be/RgaHhPDmThw?si=CLxCaBtzw3kml6V8' }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
          {/* Overlay to darken image */}
          <View style={styles.heroOverlay} />

          {/* Top Navbar / Header */}
          <View style={styles.topHeader}>
            <Image
              source={{ uri: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${userName}&backgroundColor=161f19&textColor=4be277` }}
              style={styles.headerAvatar}
            />
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialIcons name="notifications-none" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.heroContent}>
            <Text style={styles.heroTitle}>Selamat Datang,{'\n'}{userName}</Text>
            <Text style={styles.heroSubtext}>
              Platform all-in-one untuk sewa lapangan, cari lawan sparring, atau cari kawan main bareng. Olahraga makin mudah dan menyenangkan!
            </Text>
          </Animated.View>
        </View>

        {/* FLOATING SEARCH BAR */}
        <Animated.View entering={ZoomIn.duration(600).delay(300).springify()} style={styles.searchBarContainer}>
          <View style={styles.searchBarInner}>
            <View style={styles.searchItem}>
              <MaterialIcons name="sports-soccer" size={20} color={TEXT_LIGHT} />
              <View>
                <Text style={styles.searchLabel}>Aktivitas</Text>
                <Text style={styles.searchValue}>Pilih Aktivitas <MaterialIcons name="keyboard-arrow-down" size={14} /></Text>
              </View>
            </View>
            
            <View style={styles.searchDivider} />
            
            <View style={styles.searchItem}>
              <MaterialIcons name="location-on" size={20} color={TEXT_LIGHT} />
              <View>
                <Text style={styles.searchLabel}>Lokasi</Text>
                <Text style={styles.searchValue}>Pilih Kota <MaterialIcons name="keyboard-arrow-down" size={14} /></Text>
              </View>
            </View>

            <View style={styles.searchDivider} />

            <View style={styles.searchItem}>
              <MaterialIcons name="category" size={20} color={TEXT_LIGHT} />
              <View>
                <Text style={styles.searchLabel}>Cabang Olahraga</Text>
                <Text style={styles.searchValue}>Pilih Olahraga <MaterialIcons name="keyboard-arrow-down" size={14} /></Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Temukan</Text>
              <MaterialIcons name="arrow-forward" size={16} color={DARK} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* DAFTAR LAPANGAN SECTION */}
        <View style={styles.pageContent}>
          <Animated.View entering={FadeInUp.duration(600).delay(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DAFTAR LAPANGAN</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldScroll}>
              {[1, 2, 3].map((item, idx) => (
                <View key={item} style={styles.fieldCard}>
                  <Image 
                    source={{ uri: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop&sig=${item}` }}
                    style={styles.fieldImage}
                  />
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldTitle}>Arena Futsal {item}</Text>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-pin" size={14} color={MUTED} />
                      <Text style={styles.locationText}>Jakarta Selatan</Text>
                    </View>
                    <Text style={styles.fieldPrice}>Mulai Rp 150.000 / Jam</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* OLAHRAGA SAYA */}
          <Animated.View entering={FadeInRight.duration(600).delay(600).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>OLAHRAGA SAYA</Text>
            {profile?.sports && profile.sports.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsScroll}>
                {profile.sports.map((sport) => (
                  <View key={sport} style={styles.sportChip}>
                    <Text style={styles.sportLabel}>{sport.toUpperCase()}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptySportsContainer}>
                <Text style={styles.emptyText}>Belum ada olahraga pilihan.</Text>
              </View>
            )}
          </Animated.View>
        </View>

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
    paddingBottom: 100,
  },
  heroBackground: {
    width: '100%',
    height: 480,
    backgroundColor: '#000',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: GREEN,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 42,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtext: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
    maxWidth: '90%',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: -45, // Pulls the bar up into the hero section
    zIndex: 10,
  },
  searchBarInner: {
    backgroundColor: PRIMARY_RED,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  searchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  searchValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginTop: 2,
  },
  searchDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 4,
    marginLeft: 8,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: PRIMARY_RED,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_LIGHT,
    letterSpacing: 1,
  },
  viewAllText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '700',
  },
  fieldScroll: {
    gap: 16,
  },
  fieldCard: {
    width: 260,
    backgroundColor: CARD,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  fieldImage: {
    width: '100%',
    height: 140,
    backgroundColor: CARD_LIGHT,
  },
  fieldInfo: {
    padding: 16,
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: MUTED,
  },
  fieldPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: GREEN,
  },
  sportsScroll: {
    gap: 8,
  },
  sportChip: {
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  emptySportsContainer: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: MUTED,
    fontStyle: 'italic',
  }
});


