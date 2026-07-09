import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Image, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUsernameCheck } from '../hooks/useUsernameCheck';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const SPORTS = [
  { id: 'soccer',     label: 'SEPAKBOLA',  icon: 'sports-soccer' as const },
  { id: 'futsal',     label: 'FUTSAL',     icon: 'sports-soccer' as const }, // using soccer icon for futsal
  { id: 'basketball', label: 'BASKET',     icon: 'sports-basketball' as const },
  { id: 'badminton',  label: 'BADMINTON',  icon: 'sports-tennis' as const },
];

const SPORT_PREFIXES = [
  'Striker', 'GoalGetter', 'Slamdunk', 'Pebulutangkis', 'SmashMaster',
  'Playmaker', 'Defender', 'AceSpiker', 'FastDribbler', 'CourtKing',
  'NetViper', 'MidfieldGenius', 'Jumper', 'Winger', 'Keeper'
];

const PRESET_AVATARS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=250&h=250' }, // Athlete male
  { id: '2', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=250&h=250' }, // Athlete female
  { id: '3', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=250&h=250' }, // Athlete male workout
  { id: '4', url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=250&h=250' }, // Active female portrait
  { id: '5', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=250&h=250' }, // Gym portrait male
  { id: '6', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=250&h=250' }, // Active fitness female
];

const KABUPATENS = [
  'JAKARTA BARAT, ID',
  'JAKARTA SELATAN, ID',
  'JAKARTA TIMUR, ID',
  'JAKARTA UTARA, ID',
  'JAKARTA PUSAT, ID',
  'BANDUNG, ID',
  'BEKASI, ID',
  'BOGOR, ID',
  'DEPOK, ID',
  'TANGERANG, ID',
  'SURABAYA, ID',
  'MALANG, ID',
  'SEMARANG, ID',
  'YOGYAKARTA, ID',
  'MEDAN, ID',
  'PALEMBANG, ID',
  'DENPASAR, ID',
  'MAKASSAR, ID',
  'BALIKPAPAN, ID',
  'SAMARINDA, ID',
];

// ────────────────────────────────────────────────────────────────────────────
// Sport Chip
// ────────────────────────────────────────────────────────────────────────────
function SportChip({
  sport, selected, onPress,
}: { sport: typeof SPORTS[0]; selected: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        style={[styles.chip, selected && styles.chipSelected]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={sport.icon}
          size={24}
          color={selected ? '#002109' : '#e5e2e1'}
        />
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {sport.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const usernameStatus = useUsernameCheck(username);

  // New features state
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [region, setRegion] = useState('JAKARTA, ID');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Scanline animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 900,
        easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 900,
        easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, []);

  const canSubmit =
    usernameStatus === 'available' &&
    selectedSports.length > 0 &&
    termsAccepted &&
    !isSubmitting;

  function toggleSport(id: string) {
    setSelectedSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (e) {
      console.log('Error signing out:', e);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_BASE_URL}/me/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username,
          sports: selectedSports,
          region,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const messages = err?.errors
          ? Object.values(err.errors as Record<string, string[]>).flat().join(' ')
          : (err?.message ?? 'Terjadi kesalahan.');
        setSubmitError(messages);
        return;
      }

      // Redirect to main app
      router.replace('/(tabs)');
    } catch {
      setSubmitError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Username status rendering
  const renderStatus = () => {
    switch (usernameStatus) {
      case 'checking':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="sync" size={14} color="#869585" />
            <Text style={[styles.statusText, { color: '#869585' }]}>Validating Identity...</Text>
          </View>
        );
      case 'available':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="check-circle" size={14} color="#4be277" />
            <Text style={[styles.statusText, { color: '#4be277' }]}>Identity Verified</Text>
          </View>
        );
      case 'taken':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="cancel" size={14} color="#ffb4ab" />
            <Text style={[styles.statusText, { color: '#ffb4ab' }]}>Username sudah dipakai</Text>
          </View>
        );
      case 'invalid':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="error" size={14} color="#ffb4ab" />
            <Text style={[styles.statusText, { color: '#ffb4ab' }]}>Too short</Text>
          </View>
        );
      default:
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="sync" size={14} color="#869585" />
            <Text style={[styles.statusText, { color: '#869585' }]}>Awaiting Identity...</Text>
          </View>
        );
    }
  };

  const filteredKabupatens = KABUPATENS.filter(k => k.toLowerCase().includes(regionSearch.toLowerCase()));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* ── Atmospheric Background ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />
        <View style={styles.radialOverlay} />
      </View>

      {/* ── Fixed Header ── */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.headerLeft} onPress={handleSignOut} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#4be277" />
          <Text style={styles.headerTitle}>AKTIFKAN KARTU</Text>
        </TouchableOpacity>
        <Text style={styles.headerGoal}>GOAL</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Section Heading ── */}
          <View style={styles.sectionHeading}>
            <Text style={styles.headingBig}>Lengkapi Identitasmu</Text>
            <Text style={styles.headingSub}>Satu langkah lagi untuk memulai perjalananmu di arena.</Text>
          </View>

          {/* ── Modern Athlete Card ── */}
          <View style={styles.card}>
            {/* Scanline */}
            <Animated.View
              style={[
                styles.scanline,
                {
                  top: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
              pointerEvents="none"
            />

            {/* Card texture overlay */}
            <View style={styles.cardGradientOverlay} pointerEvents="none" />

            <View style={styles.cardPadding}>
              {/* Card Header */}
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardLabel}>PRO PLAYER CARD</Text>
                  <Text style={styles.cardTitle}>KARTU PEMAIN</Text>
                </View>
                <View style={styles.qrIcon}>
                  <MaterialIcons name="qr-code-2" size={24} color="#4be277" />
                </View>
              </View>

              {/* Green divider line */}
              <View style={styles.cardDivider} />

              {/* Card Content: Avatar + Username input */}
              <View style={styles.cardContent}>
                {/* Avatar Wrapper (Clickable to change) */}
                <TouchableOpacity
                  style={styles.avatarWrapper}
                  onPress={() => setIsAvatarModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Animated.View style={[styles.avatarPulseBorder, { opacity: pulseAnim.interpolate({ inputRange: [1, 1.12], outputRange: [0.4, 0.9] }) }]} />
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImg}
                  />
                  <View style={styles.avatarEditBadge}>
                    <MaterialIcons name="camera-alt" size={14} color="#002109" />
                  </View>
                  <View style={styles.lvlBadge}><Text style={styles.lvlText}>LVL 01</Text></View>
                </TouchableOpacity>

                {/* Input section with Randomizer dice */}
                <View style={styles.usernameSection}>
                  <View style={styles.usernameRow}>
                    <TextInput
                      style={styles.usernameInput}
                      placeholder="USERNAME"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={username}
                      onChangeText={text => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                    />
                    <TouchableOpacity
                      style={styles.randomButton}
                      onPress={() => {
                        const rand = SPORT_PREFIXES[Math.floor(Math.random() * SPORT_PREFIXES.length)] + '_' + (Math.floor(Math.random() * 900) + 100);
                        setUsername(rand);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="casino" size={24} color="#4be277" />
                    </TouchableOpacity>
                  </View>
                  <View style={[
                    styles.usernameUnderline,
                    usernameStatus === 'available' && { backgroundColor: '#4be277' },
                    usernameStatus === 'taken' && { backgroundColor: '#ffb4ab' },
                  ]} />
                  {renderStatus()}
                </View>
              </View>

              {/* Card Footer  */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.cardStatCol}
                  onPress={() => {
                    setRegionSearch('');
                    setIsRegionModalOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardStatLabel}>REGION ✎</Text>
                  <Text style={styles.cardStatValue}>{region}</Text>
                </TouchableOpacity>
                <View style={styles.cardStatCol}>
                  <Text style={styles.cardStatLabel}>JOINED</Text>
                  <Text style={styles.cardStatValue}>OCT 2023</Text>
                </View>
                <View style={[styles.cardStatCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.cardStatLabel}>STATUS</Text>
                  <Animated.Text style={[styles.cardStatPending, { opacity: pulseAnim.interpolate({ inputRange: [1, 1.12], outputRange: [0.6, 1] }) }]}>
                    {selectedSports.length > 0 && usernameStatus === 'available' ? 'ACTIVE' : 'PENDING'}
                  </Animated.Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Sport Chip Selection ── */}
          <View style={styles.sportSection}>
            <View style={styles.sportSectionHeader}>
              <Text style={styles.sportTitle}>Pilih Cabang Utama</Text>
              <View style={styles.sportMinBadge}>
                <Text style={styles.sportMinText}>MIN. 1</Text>
              </View>
            </View>

            <View style={styles.chipGrid}>
              <View style={styles.chipRow}>
                <SportChip sport={SPORTS[0]} selected={selectedSports.includes(SPORTS[0].id)} onPress={() => toggleSport(SPORTS[0].id)} />
                <SportChip sport={SPORTS[1]} selected={selectedSports.includes(SPORTS[1].id)} onPress={() => toggleSport(SPORTS[1].id)} />
              </View>
              <View style={styles.chipRow}>
                <SportChip sport={SPORTS[2]} selected={selectedSports.includes(SPORTS[2].id)} onPress={() => toggleSport(SPORTS[2].id)} />
                <SportChip sport={SPORTS[3]} selected={selectedSports.includes(SPORTS[3].id)} onPress={() => toggleSport(SPORTS[3].id)} />
              </View>
            </View>
          </View>

          {/* ── Terms & Agreements Box ── */}
          <TouchableOpacity
            style={styles.termsBox}
            activeOpacity={0.8}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && (
                <MaterialIcons name="check" size={14} color="#002109" />
              )}
            </View>
            <Text style={styles.termsText}>
              Saya menyetujui <Text style={styles.termsLink}>Syarat & Ketentuan</Text> serta penggunaan data untuk profil atlet profesional saya.
            </Text>
          </TouchableOpacity>

          {/* ── Submit Error ── */}
          {submitError && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#ffb4ab" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          {/* spacer for fixed footer */}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Persistent Bottom CTA ── */}
      <View style={styles.footer}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <TouchableOpacity
            style={[styles.ctaButton, !canSubmit && styles.ctaButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#002109" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
                  Aktivasi Sekarang
                </Text>
                <MaterialIcons
                  name="rocket-launch"
                  size={24}
                  color={canSubmit ? '#002109' : '#3d4a3d'}
                  style={{ marginLeft: 8 }}
                />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Avatar Preset Selector Modal ── */}
      <Modal
        visible={isAvatarModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAvatarModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsAvatarModalOpen(false)} />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PILIH AVATAR ATLET</Text>
              <TouchableOpacity onPress={() => setIsAvatarModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#e5e2e1" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />
            <Text style={styles.modalSub}>Pilih avatar yang mewakili cabor utama Anda.</Text>
            <View style={styles.avatarGrid}>
              {PRESET_AVATARS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.avatarGridItem, avatarUrl === item.url && styles.avatarGridItemSelected]}
                  onPress={() => {
                    setAvatarUrl(item.url);
                    setIsAvatarModalOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.url }} style={styles.avatarGridImg} />
                  {avatarUrl === item.url && (
                    <View style={styles.avatarGridItemBadge}>
                      <MaterialIcons name="check" size={12} color="#002109" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Region Selection Modal ── */}
      <Modal
        visible={isRegionModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRegionModalOpen(false)}
      >
        <View style={styles.modalBackdropHorizontal}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsRegionModalOpen(false)} />
          <View style={[styles.modalContainerRegion, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PILIH KABUPATEN / REGION</Text>
              <TouchableOpacity onPress={() => setIsRegionModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#e5e2e1" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />

            {/* Search Input */}
            <View style={styles.regionSearchWrapper}>
              <MaterialIcons name="search" size={20} color="#869585" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.regionSearchInput}
                placeholder="Cari kabupaten/kota..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={regionSearch}
                onChangeText={setRegionSearch}
                autoCorrect={false}
              />
            </View>

            <ScrollView style={styles.regionList} showsVerticalScrollIndicator={true}>
              {filteredKabupatens.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.regionItem, region === item && styles.regionItemSelected]}
                  onPress={() => {
                    setRegion(item);
                    setIsRegionModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.regionItemText, region === item && styles.regionItemTextSelected]}>
                    {item}
                  </Text>
                  {region === item && (
                    <MaterialIcons name="check" size={18} color="#4be277" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredKabupatens.length === 0 && (
                <View style={styles.emptyRegion}>
                  <Text style={styles.emptyRegionText}>Kabupaten tidak ditemukan</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles matching the HTML energy look exactly
// ────────────────────────────────────────────────────────────────────────────
const GREEN = '#4be277';
const DARK  = '#131313';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },

  // Background atmosphere glows
  glowTopLeft: {
    position: 'absolute', top: '-10%', left: '-10%',
    width: '60%', height: '50%',
    backgroundColor: GREEN, borderRadius: 9999,
    opacity: 0.15,
  },
  glowBottomRight: {
    position: 'absolute', bottom: '-10%', right: '-10%',
    width: '50%', height: '50%',
    backgroundColor: '#4edea3', borderRadius: 9999,
    opacity: 0.15,
  },
  radialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19,19,19,0.8)',
  },

  // Fixed header
  fixedHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    height: 64,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(19,19,19,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: {
    fontSize: 24, fontWeight: '900', color: GREEN, letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  headerGoal: {
    fontSize: 32, fontWeight: '900', color: GREEN, fontStyle: 'italic',
    letterSpacing: -1, opacity: 0.3,
  },

  // Scroll content
  scrollContent: { paddingTop: 104, paddingHorizontal: 20, paddingBottom: 24 },

  // Section heading
  sectionHeading: { marginBottom: 28 },
  headingBig: { fontSize: 28, fontWeight: '900', color: '#e5e2e1', textTransform: 'uppercase', letterSpacing: -0.5 },
  headingSub: { fontSize: 16, color: '#bccbb9', marginTop: 6, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: 'rgba(30,30,30,0.6)',
    borderRadius: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6, shadowRadius: 30, elevation: 15,
    marginBottom: 28,
  },
  cardPadding: { padding: 24 },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  scanline: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: 'rgba(75,226,119,0.3)',
    zIndex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 12, fontWeight: '700', color: GREEN,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 24, fontWeight: '900', color: '#fff', opacity: 0.9,
    letterSpacing: 0.5,
  },
  qrIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#353534',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 18,
  },

  // Avatar + content
  cardContent: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  avatarWrapper: { width: 112, height: 112, position: 'relative' },
  avatarPulseBorder: {
    position: 'absolute', inset: 0, borderRadius: 18,
    borderWidth: 2, borderColor: GREEN,
  },
  avatarImg: { width: 112, height: 112, borderRadius: 16 },
  lvlBadge: {
    position: 'absolute', bottom: -8, right: -8,
    backgroundColor: GREEN, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  lvlText: { fontSize: 10, fontWeight: '900', color: '#002109', letterSpacing: 0.5 },

  // Username Section
  usernameSection: { flex: 1, justifyContent: 'center' },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameInput: {
    color: '#fff', fontSize: 24, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingVertical: 4, paddingHorizontal: 0,
    borderBottomWidth: 0,
    flex: 1,
  },
  randomButton: {
    padding: 8,
    marginLeft: 4,
  },
  usernameUnderline: {
    height: 2, backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 8, borderRadius: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 18, marginTop: 18,
  },
  cardStatCol: { flex: 1 },
  cardStatLabel: { fontSize: 10, color: '#869585', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  cardStatValue: { fontSize: 14, color: '#fff', fontWeight: '750' },
  cardStatPending: { fontSize: 14, color: GREEN, fontWeight: '900', letterSpacing: 0.5 },

  // Sports selection
  sportSection: { marginBottom: 28 },
  sportSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sportTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  sportMinBadge: {
    backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  sportMinText: { fontSize: 10, color: '#869585', fontWeight: '700', letterSpacing: 1 },

  chipGrid: { gap: 12 },
  chipRow: { flexDirection: 'row', gap: 12 },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1c1b1b',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16,
  },
  chipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 8,
  },
  chipText: { fontSize: 16, fontWeight: '750', color: '#869585', textTransform: 'uppercase', flex: 1 },
  chipTextSelected: { color: '#002109' },

  // Terms and Agreements
  termsBox: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(14,14,14,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, padding: 16, marginBottom: 20,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  termsText: { fontSize: 14, color: '#bccbb9', flex: 1, lineHeight: 18 },
  termsLink: { color: GREEN, textDecorationLine: 'underline' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(58,13,16,0.8)',
    borderLeftWidth: 3, borderLeftColor: '#ffb4ab',
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  errorText: { color: '#ffb4ab', fontSize: 14, flex: 1 },

  // Fixed Bottom CTA
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  ctaButton: {
    backgroundColor: GREEN,
    height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  ctaButtonDisabled: {
    backgroundColor: '#1d3da3', // faint dim color
    opacity: 0.5,
    shadowOpacity: 0, elevation: 0,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center' },
  ctaText: {
    fontSize: 20, fontWeight: '900', color: '#002109',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  ctaTextDisabled: { color: '#3d4a3d' },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdropHorizontal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContainerRegion: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderWidth: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GREEN,
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  modalSub: {
    fontSize: 14,
    color: '#bccbb9',
    marginBottom: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  avatarGridItem: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarGridItemSelected: {
    borderColor: GREEN,
  },
  avatarGridImg: {
    width: '100%',
    height: '100%',
  },
  avatarGridItemBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: GREEN,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: GREEN,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DARK,
  },
  regionSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  regionSearchInput: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  regionList: {
    maxHeight: 300,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  regionItemSelected: {
    backgroundColor: 'rgba(75, 226, 119, 0.08)',
    borderRadius: 10,
  },
  regionItemText: {
    fontSize: 15,
    color: '#bccbb9',
    fontWeight: '500',
  },
  regionItemTextSelected: {
    color: GREEN,
    fontWeight: '800',
  },
  emptyRegion: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyRegionText: {
    fontSize: 14,
    color: '#869585',
  },
});
// Force Metro rebuild
