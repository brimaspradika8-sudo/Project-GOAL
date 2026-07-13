import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
  Platform, ScrollView, Image, Modal, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';
import { useProfileStore } from '../store/profileStore';
import { useUsernameCheck } from '../hooks/useUsernameCheck';

const GREEN = '#4be277';
const DARK = '#131313';
const CARD = '#1a2e1f';
const CARD_BORDER = '#263d2c';
const MUTED = '#627369';
const INPUT_BG = '#162119';

const SPORTS = [
  { id: 'futsal',      label: 'FUTSAL',       icon: 'sports-soccer' as const },
  { id: 'basketball',  label: 'BASKET',       icon: 'sports-basketball' as const },
  { id: 'badminton',   label: 'BADMINTON',    icon: 'sports-tennis' as const },
  { id: 'volleyball',  label: 'VOLI',         icon: 'sports-volleyball' as const },
  { id: 'minisoccer',  label: 'MINI SOCCER',  icon: 'sports-soccer' as const },
  { id: 'tennis',      label: 'TENIS',        icon: 'sports-tennis' as const },
  { id: 'tabletennis', label: 'TENIS MEJA',   icon: 'sports' as const },
  { id: 'others',      label: 'LAINNYA',      icon: 'more-horiz' as const },
];

const SPORT_PREFIXES = [
  'Striker', 'GoalGetter', 'Slamdunk', 'Pebulutangkis', 'SmashMaster',
  'Playmaker', 'Defender', 'AceSpiker', 'FastDribbler', 'CourtKing',
  'NetViper', 'MidfieldGenius', 'Jumper', 'Winger', 'Keeper',
  'StrikerMaut', 'KiperGanteng', 'MaestroFutsal', 'RajaLapangan'
];

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=131313';
const TOTAL_STEPS = 2;

const PROVINCES = [
  'DKI JAKARTA',
  'JAWA BARAT',
  'JAWA TENGAH',
  'JAWA TIMUR',
];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'DKI JAKARTA': [
    'JAKARTA SELATAN, ID',
    'JAKARTA PUSAT, ID',
    'JAKARTA UTARA, ID',
    'JAKARTA BARAT, ID',
    'JAKARTA TIMUR, ID',
  ],
  'JAWA BARAT': [
    'BANDUNG, ID',
    'BEKASI, ID',
    'BOGOR, ID',
    'DEPOK, ID',
    'TANGERANG, ID',
    'CIREBON, ID',
    'CIAMIS, ID',
    'TASIKMALAYA, ID',
  ],
  'JAWA TENGAH': [
    'SEMARANG, ID',
    'YOGYAKARTA, ID',
    'SURAKARTA, ID',
    'PURWOKERTO, ID',
    'TEGAL, ID',
    'TEMANGGUNG, ID',
    'WONOGIRI, ID',
    'WONOSOBO, ID',
  ],
  'JAWA TIMUR': [
    'SURABAYA, ID',
    'MALANG, ID',
    'KEDIRI, ID',
    'GRESIK, ID',
    'LAMONGAN, ID',
    'SIDOARJO, ID',
    'JOMBANG, ID',
    'NGANJUK, ID',
  ],
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const usernameStatus = useUsernameCheck(username);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [region, setRegion] = useState(CITIES_BY_PROVINCE[PROVINCES[0]][0]);
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const diceRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => { anim.stop(); };
  }, []);

  const canCompleteUsername = usernameStatus === 'available' && username.trim().length >= 3 && termsAccepted;
  const canCompleteRegion = !!selectedProvince && !!region;
  const canCompleteSports = selectedSports.length > 0;
  const canGoNext = step === 1 ? (canCompleteUsername && canCompleteRegion) : canCompleteSports;
  const canSubmit = canCompleteSports && !isSubmitting;

  function toggleSport(id: string) {
    setSelectedSports(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Error signing out:', e);
    }
  }

  function handleBack() {
    if (step > 1) setStep(prev => prev - 1);
  }

  async function handleNextStep() {
    if (!canGoNext) return;
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/me/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ username, sports: selectedSports, region, avatar_url: avatarUrl }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json();
        const messages = err?.errors
          ? Object.values(err.errors as Record<string, string[]>).flat().join(' ')
          : (err?.message ?? 'Terjadi kesalahan.');
        setSubmitError(messages);
        return;
      }
      const profile = await res.json();
      useProfileStore.setState({ profile, loading: false });
      router.replace('/(tabs)/profile');
    } catch (e) {
      setSubmitError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const pickAvatarFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Izinkan akses galeri di pengaturan untuk memilih foto profil.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal membuka galeri. Coba lagi.');
    }
  };

  const triggerDiceRoll = () => {
    Animated.sequence([
      Animated.timing(diceRotateAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(diceRotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    const rand = SPORT_PREFIXES[Math.floor(Math.random() * SPORT_PREFIXES.length)] + '_' + (Math.floor(Math.random() * 900) + 100);
    setUsername(rand);
  };

  const spin = diceRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const renderStatus = () => {
    switch (usernameStatus) {
      case 'checking':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="sync" size={13} color={MUTED} />
            <Text style={[styles.statusText, { color: MUTED }]}>Memeriksa...</Text>
          </View>
        );
      case 'available':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="check-circle" size={13} color={GREEN} />
            <Text style={[styles.statusText, { color: GREEN }]}>Tersedia</Text>
          </View>
        );
      case 'taken':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="cancel" size={13} color="#f43f5e" />
            <Text style={[styles.statusText, { color: '#f43f5e' }]}>Sudah digunakan</Text>
          </View>
        );
      case 'invalid':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="error" size={13} color="#f43f5e" />
            <Text style={[styles.statusText, { color: '#f43f5e' }]}>Terlalu singkat</Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="wifi-off" size={13} color="#f59e0b" />
            <Text style={[styles.statusText, { color: '#f59e0b' }]}>Gagal memeriksa</Text>
          </View>
        );
      default:
        return (
          <View style={styles.statusRow}>
            <MaterialIcons name="info-outline" size={13} color={MUTED} />
            <Text style={[styles.statusText, { color: MUTED }]}>Minimal 3 karakter</Text>
          </View>
        );
    }
  };

  const filteredCities = (CITIES_BY_PROVINCE[selectedProvince] || []).filter(k =>
    k.toLowerCase().includes(regionSearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />

      {/* Progress Bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* Background Glows */}
      <View style={[StyleSheet.absoluteFill, styles.pointerEventsNone]}>
        <View style={styles.glow1} />
        <View style={styles.glow2} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, step === 1 && { opacity: 0.3 }]}
          onPress={handleBack}
          disabled={step === 1}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>LANGKAH {step} DARI {TOTAL_STEPS}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.closeBtn} activeOpacity={0.7}>
          <MaterialIcons name="close" size={20} color={MUTED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {step === 1 ? (
            <View>
              {/* Title */}
              <Text style={styles.title}>Lengkapi Profil Pemain</Text>
              <Text style={styles.subtitle}>Lengkapi data profil agar akun Anda siap digunakan.</Text>

              {/* Player Card */}
              <View style={styles.card}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardTag}>PENYIAPAN AKUN</Text>
                    <Text style={styles.cardTitle}>PROFIL PEMAIN</Text>
                  </View>
                  <View style={styles.cardIcon}>
                    <MaterialIcons name="person-outline" size={20} color={GREEN} />
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Avatar */}
                <View style={styles.avatarCenter}>
                  <TouchableOpacity onPress={pickAvatarFromGallery} activeOpacity={0.8}>
                    <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
                      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    </Animated.View>
                    <View style={styles.cameraBadge}>
                      <MaterialIcons name="camera-alt" size={12} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Username */}
                <Text style={styles.label}>USERNAME</Text>
                <View style={styles.inputRow}>
                  <MaterialIcons name="alternate-email" size={18} color={MUTED} />
                  <TextInput
                    style={styles.input}
                    placeholder="username_kamu"
                    placeholderTextColor={MUTED}
                    value={username}
                    onChangeText={text => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                  />
                  <TouchableOpacity onPress={triggerDiceRoll} activeOpacity={0.7} style={styles.diceBtn}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <MaterialIcons name="casino" size={22} color={GREEN} />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
                {renderStatus()}

                <View style={styles.cardDivider} />

                {/* Location */}
                <Text style={styles.label}>LOKASI</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setIsProvinceModalOpen(true)} activeOpacity={0.7}>
                  <Text style={styles.dropdownLabel}>Provinsi</Text>
                  <View style={styles.dropdownRow}>
                    <Text style={styles.dropdownValue}>{selectedProvince}</Text>
                    <MaterialIcons name="expand-more" size={20} color={MUTED} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdown} onPress={() => { setRegionSearch(''); setIsRegionModalOpen(true); }} activeOpacity={0.7}>
                  <Text style={styles.dropdownLabel}>Kota / Kabupaten</Text>
                  <View style={styles.dropdownRow}>
                    <Text style={styles.dropdownValue}>{region.replace(', ID', '')}</Text>
                    <MaterialIcons name="expand-more" size={20} color={MUTED} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <TouchableOpacity style={styles.termsRow} activeOpacity={0.8} onPress={() => setTermsAccepted(!termsAccepted)}>
                <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                  {termsAccepted && <MaterialIcons name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  Saya menyetujui <Text style={styles.termsLink}>Syarat dan Ketentuan</Text> serta penggunaan data untuk keperluan profil.
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Title */}
              <Text style={styles.title}>Pilih Preferensi Olahraga</Text>
              <Text style={styles.subtitle}>Pilih minimal satu jenis olahraga.</Text>

              {/* Sports Grid */}
              <View style={styles.sportsGrid}>
                {SPORTS.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id);
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      style={[styles.sportCard, isSelected && styles.sportCardActive]}
                      onPress={() => toggleSport(sport.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name={sport.icon}
                        size={28}
                        color={isSelected ? GREEN : MUTED}
                      />
                      <Text style={[styles.sportLabel, isSelected && styles.sportLabelActive]}>
                        {sport.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.sportCheck}>
                          <MaterialIcons name="check" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Preview Card */}
              <View style={styles.previewCard}>
                <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewName}>{username || 'username'}</Text>
                  <Text style={styles.previewSub}>Profil Anda hampir selesai disiapkan.</Text>
                </View>
                <MaterialIcons name="sports" size={24} color={GREEN} />
              </View>
            </View>
          )}

          {/* Error */}
          {submitError && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#f43f5e" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, (!canGoNext && !canSubmit) && styles.ctaBtnDisabled]}
          onPress={step === 1 ? handleNextStep : handleSubmit}
          disabled={step === 1 ? !canGoNext : !canSubmit}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.ctaText}>
                {step === 1 ? 'Lanjutkan' : 'Simpan Profil'}
              </Text>
              <MaterialIcons
                name={step === 1 ? 'arrow-forward' : 'rocket-launch'}
                size={20}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Province Modal */}
      <Modal visible={isProvinceModalOpen} transparent animationType="slide" onRequestClose={() => setIsProvinceModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsProvinceModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Provinsi</Text>
            <View style={styles.modalDivider} />
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator>
              {PROVINCES.map((prov) => (
                <TouchableOpacity
                  key={prov}
                  style={[styles.modalItem, selectedProvince === prov && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedProvince(prov);
                    setRegion(CITIES_BY_PROVINCE[prov][0]);
                    setIsProvinceModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalItemText, selectedProvince === prov && styles.modalItemTextActive]}>{prov}</Text>
                  {selectedProvince === prov && <MaterialIcons name="check" size={18} color={GREEN} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal visible={isRegionModalOpen} transparent animationType="slide" onRequestClose={() => setIsRegionModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsRegionModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Kota atau Kabupaten</Text>
            <View style={styles.modalDivider} />
            <View style={styles.searchRow}>
              <MaterialIcons name="search" size={18} color={MUTED} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari..."
                placeholderTextColor={MUTED}
                value={regionSearch}
                onChangeText={setRegionSearch}
                autoCorrect={false}
              />
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator>
              {filteredCities.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, region === item && styles.modalItemActive]}
                  onPress={() => { setRegion(item); setIsRegionModalOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalItemText, region === item && styles.modalItemTextActive]}>{item.replace(', ID', '')}</Text>
                  {region === item && <MaterialIcons name="check" size={18} color={GREEN} />}
                </TouchableOpacity>
              ))}
              {filteredCities.length === 0 && (
                <Text style={styles.emptyText}>Kota tidak ditemukan</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  pointerEventsNone: { pointerEvents: 'none' },

  // Progress
  progressBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#1e2e23', zIndex: 60 },
  progressFill: { height: '100%', backgroundColor: GREEN, shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },

  // Background glows
  glow1: { position: 'absolute', top: '-15%', left: '-20%', width: '60%', height: '40%', backgroundColor: GREEN, borderRadius: 999, opacity: 0.06 },
  glow2: { position: 'absolute', bottom: '-15%', right: '-20%', width: '60%', height: '40%', backgroundColor: '#86efac', borderRadius: 999, opacity: 0.04 },

  // Header
  header: {
    position: 'absolute', top: 8, left: 0, right: 0, zIndex: 50,
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },

  // Scroll
  scroll: { paddingTop: 72, paddingHorizontal: 20, paddingBottom: 100 },

  // Typography
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: MUTED, marginBottom: 28, lineHeight: 20 },

  // Card
  card: {
    backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: CARD_BORDER,
    padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1 },
  cardTag: { fontSize: 10, fontWeight: '800', color: GREEN, letterSpacing: 1, marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(75,226,119,0.12)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(75,226,119,0.2)',
  },
  cardDivider: { height: 1, backgroundColor: CARD_BORDER, marginVertical: 18 },

  // Avatar
  avatarCenter: { alignItems: 'center', marginBottom: 28 },
  avatarRing: { width: 96, height: 96, borderRadius: 28, borderWidth: 2.5, borderColor: GREEN, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%', borderRadius: 26 },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: DARK,
  },

  // Labels & Inputs
  label: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: INPUT_BG, borderRadius: 14, borderWidth: 1, borderColor: CARD_BORDER,
    paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', padding: 0 },
  diceBtn: { padding: 4 },

  // Status
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  // Dropdown
  dropdown: {
    backgroundColor: INPUT_BG, borderRadius: 14, borderWidth: 1, borderColor: CARD_BORDER,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
  },
  dropdownLabel: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownValue: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Terms
  termsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: CARD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  checkboxActive: { backgroundColor: GREEN, borderColor: GREEN },
  termsText: { fontSize: 12, color: '#9aaba0', flex: 1, lineHeight: 18 },
  termsLink: { color: GREEN, fontWeight: '700' },

  // Sports Grid
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  sportCard: {
    width: '48%', flexGrow: 1, height: 88,
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: CARD_BORDER,
    justifyContent: 'center', alignItems: 'center', gap: 8,
    position: 'relative',
  },
  sportCardActive: { backgroundColor: 'rgba(75,226,119,0.1)', borderColor: GREEN },
  sportLabel: { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 0.3 },
  sportLabelActive: { color: GREEN },
  sportCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
  },

  // Preview Card
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: CARD_BORDER,
    padding: 14, marginTop: 4,
  },
  previewAvatar: { width: 44, height: 44, borderRadius: 12 },
  previewName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  previewSub: { fontSize: 12, color: MUTED, marginTop: 2 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(244,63,94,0.1)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)', padding: 12, marginTop: 12,
  },
  errorText: { color: '#f43f5e', fontSize: 13, flex: 1 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 18, paddingTop: 12,
    backgroundColor: 'rgba(19,19,19,0.92)',
  },
  ctaBtn: {
    flexDirection: 'row', height: 54, borderRadius: 16,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  ctaBtnDisabled: { backgroundColor: '#2a3d30', shadowOpacity: 0, elevation: 0 },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1a2e1f', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2d4433', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  modalDivider: { height: 1, backgroundColor: CARD_BORDER, marginVertical: 14 },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#1e2e23',
  },
  modalItemActive: { backgroundColor: 'rgba(75,226,119,0.08)', borderRadius: 10 },
  modalItemText: { fontSize: 14, color: '#b8c8bb', fontWeight: '500' },
  modalItemTextActive: { color: GREEN, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: INPUT_BG, borderRadius: 12, borderWidth: 1, borderColor: CARD_BORDER,
    paddingHorizontal: 12, height: 44, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 24 },
});
