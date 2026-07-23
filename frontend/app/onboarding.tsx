import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from '../lib/secureStorage';
import { router } from 'expo-router';
import { API_BASE_URL } from '../lib/api';
import { useProfileStore } from '../store/profileStore';
import { useUsernameCheck } from '../hooks/useUsernameCheck';
import { TOKEN_KEY } from './_layout';
import { COLORS, FONTS, SHADOWS } from '../components/goalTheme';
import AuthInput from '../components/AuthInput';

const SPORTS = [
  { id: 'futsal', label: 'Futsal', icon: 'sports-soccer' as const },
  { id: 'basketball', label: 'Basket', icon: 'sports-basketball' as const },
  { id: 'badminton', label: 'Badminton', icon: 'sports-tennis' as const },
  { id: 'volleyball', label: 'Voli', icon: 'sports-volleyball' as const },
  { id: 'minisoccer', label: 'Mini Soccer', icon: 'sports-soccer' as const },
  { id: 'tennis', label: 'Tenis', icon: 'sports-tennis' as const },
  { id: 'tabletennis', label: 'Padel', icon: 'sports' as const },
  { id: 'others', label: 'Lainnya', icon: 'more-horiz' as const },
];

const USERNAME_PREFIXES = [
  'GoalPlaymaker',
  'ArenaCaptain',
  'FastBooking',
  'WeekendStriker',
  'CourtHunter',
  'MatchReady',
  'SportBuddy',
  'FieldRunner',
];

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=f9f9fc';
const TOTAL_STEPS = 2;

const PROVINCES = ['DKI JAKARTA', 'JAWA BARAT', 'JAWA TENGAH', 'JAWA TIMUR'];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'DKI JAKARTA': ['JAKARTA SELATAN, ID', 'JAKARTA PUSAT, ID', 'JAKARTA UTARA, ID', 'JAKARTA BARAT, ID', 'JAKARTA TIMUR, ID'],
  'JAWA BARAT': ['BANDUNG, ID', 'BEKASI, ID', 'BOGOR, ID', 'DEPOK, ID', 'TANGERANG, ID', 'CIREBON, ID', 'TASIKMALAYA, ID', 'PURWAKARTA, ID'],
  'JAWA TENGAH': ['SEMARANG, ID', 'YOGYAKARTA, ID', 'SURAKARTA, ID', 'PURWOKERTO, ID', 'WONOGIRI, ID'],
  'JAWA TIMUR': ['SURABAYA, ID', 'MALANG, ID', 'KEDIRI, ID', 'SIDOARJO, ID', 'JOMBANG, ID', 'NGANJUK, ID'],
};

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
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
  const slideAnim = useRef(new Animated.Value(32)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const diceRotateAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(32);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const canCompleteUsername = usernameStatus === 'available' && username.trim().length >= 3 && termsAccepted;
  const canCompleteRegion = !!selectedProvince && !!region;
  const canCompleteSports = selectedSports.length > 0;
  const canGoNext = step === 1 ? canCompleteUsername && canCompleteRegion : canCompleteSports;
  const canSubmit = canCompleteSports && !isSubmitting;

  function toggleSport(id: string) {
    setSelectedSports((prev) => prev.includes(id) ? prev.filter((sport) => sport !== id) : [...prev, id]);
  }

  async function handleSignOut() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      useProfileStore.getState().clearProfile();
      router.replace('/login');
    } catch {}
  }

  function handleBack() {
    if (step > 1) setStep((prev) => prev - 1);
  }

  async function handleNextStep() {
    if (!canGoNext) return;
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/me/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ username, sports: selectedSports, region, avatar_url: avatarUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json();
        const messages = err?.errors
          ? Object.values(err.errors as Record<string, string[]>).flat().join(' ')
          : err?.message ?? 'Terjadi kesalahan.';
        setSubmitError(messages);
        return;
      }

      const profile = await res.json();
      useProfileStore.setState({ profile, loading: false });
      router.replace('/(tabs)');
    } catch {
      if (mountedRef.current) setSubmitError('Gagal terhubung ke server. Silakan coba lagi.');
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  const pickAvatarFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Silakan izinkan akses galeri untuk memilih foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mime = asset.mimeType || '';
        const uri = asset.uri;
        const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
        if (!allowedMimes.includes(mime) && !allowedExts.includes(ext)) {
          Alert.alert('Format Tidak Didukung', 'Foto harus berformat JPG, JPEG, PNG, atau WEBP.');
          return;
        }
        if ((asset.fileSize ?? 0) > 5 * 1024 * 1024) {
          Alert.alert('Ukuran Terlalu Besar', 'Ukuran foto maksimal 5MB.');
          return;
        }
        setAvatarUrl(uri);
      }
    } catch {
      Alert.alert('Kesalahan', 'Gagal membuka galeri. Silakan coba lagi.');
    }
  };

  const triggerDiceRoll = () => {
    Animated.sequence([
      Animated.timing(diceRotateAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(diceRotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    const prefix = USERNAME_PREFIXES[Math.floor(Math.random() * USERNAME_PREFIXES.length)];
    setUsername(`${prefix}_${Math.floor(Math.random() * 900) + 100}`);
  };

  const spin = diceRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const filteredCities = (CITIES_BY_PROVINCE[selectedProvince] || []).filter((city) =>
    city.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const renderStatus = () => {
    const statusConfig = {
      checking: { icon: 'sync' as const, color: COLORS.textSecondary, text: 'Memeriksa username...' },
      available: { icon: 'check-circle' as const, color: COLORS.primary, text: 'Username tersedia' },
      taken: { icon: 'cancel' as const, color: COLORS.error, text: 'Username sudah digunakan' },
      invalid: { icon: 'error' as const, color: COLORS.error, text: 'Minimal 3 karakter, gunakan huruf/angka/underscore' },
      error: { icon: 'wifi-off' as const, color: '#d97706', text: 'Gagal memeriksa username' },
      idle: { icon: 'info-outline' as const, color: COLORS.textSecondary, text: 'Gunakan minimal 3 karakter' },
    };
    const config = statusConfig[usernameStatus || 'idle'] ?? statusConfig.idle;

    return (
      <View style={styles.statusRow}>
        <MaterialIcons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
      </View>
    );
  };

  const renderStepOne = () => (
    <Animated.View style={[styles.formPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>Profil Pemain</Text>
        <Text style={styles.title}>Siapkan identitas akunmu</Text>
        <Text style={styles.subtitle}>Username, foto, dan lokasi membantu GOAL menampilkan venue yang lebih relevan.</Text>
      </View>

      <View style={styles.avatarArea}>
        <TouchableOpacity onPress={pickAvatarFromGallery} activeOpacity={0.85}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </Animated.View>
          <View style={styles.cameraBadge}>
            <MaterialIcons name="photo-camera" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <View style={styles.avatarTextWrap}>
          <Text style={styles.avatarTitle}>Foto Profil</Text>
          <Text style={styles.avatarText}>Pilih foto yang mudah dikenali saat booking atau join match.</Text>
        </View>
      </View>

      <AuthInput
        icon="alternate-email"
        label="Username"
        value={username}
        onChangeText={(text: string) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        rightElement={
          <TouchableOpacity onPress={triggerDiceRoll} activeOpacity={0.7} style={styles.diceBtn}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialIcons name="casino" size={24} color={COLORS.primary} />
            </Animated.View>
          </TouchableOpacity>
        }
      />
      {renderStatus()}

      <Text style={styles.fieldGroupLabel}>Lokasi utama</Text>
      <View style={isDesktop ? styles.dropdownGrid : undefined}>
        <TouchableOpacity style={[styles.dropdown, isDesktop && styles.dropdownHalf]} onPress={() => setIsProvinceModalOpen(true)} activeOpacity={0.75}>
          <View>
            <Text style={styles.dropdownLabel}>Provinsi</Text>
            <Text style={styles.dropdownValue}>{selectedProvince}</Text>
          </View>
          <MaterialIcons name="expand-more" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dropdown, isDesktop && styles.dropdownHalf]}
          onPress={() => {
            setRegionSearch('');
            setIsRegionModalOpen(true);
          }}
          activeOpacity={0.75}
        >
          <View>
            <Text style={styles.dropdownLabel}>Kota / Kabupaten</Text>
            <Text style={styles.dropdownValue}>{region.replace(', ID', '')}</Text>
          </View>
          <MaterialIcons name="expand-more" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.termsRow} activeOpacity={0.8} onPress={() => setTermsAccepted(!termsAccepted)}>
        <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
          {termsAccepted && <MaterialIcons name="check" size={13} color="#ffffff" />}
        </View>
        <Text style={styles.termsText}>
          Saya menyetujui <Text style={styles.termsLink}>Syarat dan Ketentuan</Text> serta penggunaan data untuk profil GOAL.
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStepTwo = () => (
    <Animated.View style={[styles.formPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>Preferensi</Text>
        <Text style={styles.title}>Pilih olahraga favorit</Text>
        <Text style={styles.subtitle}>Pilih minimal satu supaya rekomendasi venue dan match terasa lebih pas.</Text>
      </View>

      <View style={styles.sportsGrid}>
        {SPORTS.map((sport) => {
          const isSelected = selectedSports.includes(sport.id);
          return (
            <TouchableOpacity
              key={sport.id}
              style={[styles.sportCard, isDesktop && styles.sportCardDesktop, isSelected && styles.sportCardActive]}
              onPress={() => toggleSport(sport.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.sportIconWrap, isSelected && styles.sportIconWrapActive]}>
                <MaterialIcons name={sport.icon} size={24} color={isSelected ? '#ffffff' : COLORS.primary} />
              </View>
              <Text style={[styles.sportLabel, isSelected && styles.sportLabelActive]}>{sport.label}</Text>
              {isSelected && (
                <View style={styles.sportCheck}>
                  <MaterialIcons name="check" size={12} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.previewCard}>
        <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
        <View style={styles.previewBody}>
          <Text style={styles.previewName}>{username || 'username'}</Text>
          <Text style={styles.previewSub}>{selectedSports.length} olahraga dipilih · {region.replace(', ID', '')}</Text>
        </View>
        <View style={styles.previewBadge}>
          <MaterialIcons name="sports" size={18} color={COLORS.primary} />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={[styles.iconButton, step === 1 && styles.iconButtonDisabled]} onPress={handleBack} disabled={step === 1} activeOpacity={0.75}>
          <MaterialIcons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>Langkah {step} / {TOTAL_STEPS}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.iconButton} activeOpacity={0.75}>
          <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.pageShell, isDesktop && styles.pageShellDesktop]}>
          <View style={[styles.sidePanel, isDesktop && styles.sidePanelDesktop]}>
            <View style={styles.brandMark}>
              <MaterialIcons name="sports-soccer" size={24} color="#ffffff" />
            </View>
            <Text style={styles.sideTitle}>GOAL</Text>
            <Text style={styles.sideSubtitle}>Buat profil bermain yang siap dipakai untuk booking lapangan dan mencari match.</Text>

            <View style={styles.stepList}>
              <View style={[styles.stepItem, step === 1 && styles.stepItemActive]}>
                <MaterialIcons name="person-outline" size={18} color={step === 1 ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.stepItemText, step === 1 && styles.stepItemTextActive]}>Profil & Lokasi</Text>
              </View>
              <View style={[styles.stepItem, step === 2 && styles.stepItemActive]}>
                <MaterialIcons name="sports" size={18} color={step === 2 ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.stepItemText, step === 2 && styles.stepItemTextActive]}>Preferensi Olahraga</Text>
              </View>
            </View>
          </View>

          <View style={styles.contentPanel}>
            {step === 1 ? renderStepOne() : renderStepTwo()}

            {submitError && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerShell}>
          <TouchableOpacity
            style={[styles.ctaBtn, (step === 1 ? !canGoNext : !canSubmit) && styles.ctaBtnDisabled]}
            onPress={step === 1 ? handleNextStep : handleSubmit}
            disabled={step === 1 ? !canGoNext : !canSubmit}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.ctaText}>{step === 1 ? 'Lanjutkan' : 'Simpan Profil'}</Text>
                <MaterialIcons name={step === 1 ? 'arrow-forward' : 'check-circle'} size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <LocationModal
        visible={isProvinceModalOpen}
        title="Pilih Provinsi"
        items={PROVINCES}
        selected={selectedProvince}
        onClose={() => setIsProvinceModalOpen(false)}
        onSelect={(province) => {
          setSelectedProvince(province);
          setRegion(CITIES_BY_PROVINCE[province][0]);
          setIsProvinceModalOpen(false);
        }}
      />

      <Modal visible={isRegionModalOpen} transparent animationType="slide" onRequestClose={() => setIsRegionModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsRegionModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Kota atau Kabupaten</Text>
            <View style={styles.searchRow}>
              <MaterialIcons name="search" size={18} color={COLORS.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari kota..."
                placeholderTextColor={COLORS.textTertiary}
                value={regionSearch}
                onChangeText={setRegionSearch}
                autoCorrect={false}
              />
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator>
              {filteredCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.modalItem, region === city && styles.modalItemActive]}
                  onPress={() => {
                    setRegion(city);
                    setIsRegionModalOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.modalItemText, region === city && styles.modalItemTextActive]}>{city.replace(', ID', '')}</Text>
                  {region === city && <MaterialIcons name="check" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
              {filteredCities.length === 0 && <Text style={styles.emptyText}>Kota tidak ditemukan</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function LocationModal({
  visible,
  title,
  items,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  items: string[];
  selected: string;
  onClose: () => void;
  onSelect: (item: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator>
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modalItem, selected === item && styles.modalItemActive]}
                onPress={() => onSelect(item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.modalItemText, selected === item && styles.modalItemTextActive]}>{item}</Text>
                {selected === item && <MaterialIcons name="check" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 18 : 10,
    left: 0,
    right: 0,
    zIndex: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  stepPill: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stepPillText: {
    ...FONTS.labelMd,
    color: COLORS.textSecondary,
  },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 88 : 78,
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  pageShell: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  pageShellDesktop: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'stretch',
  },
  sidePanel: {
    backgroundColor: COLORS.inverseSurface,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  sidePanelDesktop: {
    width: 340,
    marginBottom: 0,
    minHeight: 560,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sideTitle: {
    ...FONTS.headlineLg,
    color: '#ffffff',
  },
  sideSubtitle: {
    ...FONTS.bodyMd,
    color: 'rgba(255,255,255,0.76)',
    marginTop: 8,
  },
  stepList: {
    gap: 10,
    marginTop: 26,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepItemActive: {
    backgroundColor: '#ffffff',
  },
  stepItemText: {
    ...FONTS.labelLg,
    color: 'rgba(255,255,255,0.72)',
  },
  stepItemTextActive: {
    color: COLORS.text,
  },
  contentPanel: {
    flex: 1,
  },
  formPanel: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 20,
    ...SHADOWS.md,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  kicker: {
    ...FONTS.labelMd,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    ...FONTS.headlineLg,
    color: COLORS.text,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  avatarArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceWhite,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextWrap: {
    flex: 1,
  },
  avatarTitle: {
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  avatarText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  diceBtn: {
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  statusText: {
    ...FONTS.bodySm,
    fontWeight: '600',
  },
  fieldGroupLabel: {
    ...FONTS.labelMd,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  dropdownGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 14,
    marginBottom: 12,
  },
  dropdownHalf: {
    flex: 1,
  },
  dropdownLabel: {
    ...FONTS.labelSm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  dropdownValue: {
    ...FONTS.labelLg,
    color: COLORS.text,
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportCard: {
    width: '47%' as any,
    flexGrow: 1,
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
  },
  sportCardDesktop: {
    width: '30%' as any,
  },
  sportCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  sportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  sportLabel: {
    ...FONTS.labelLg,
    color: COLORS.text,
  },
  sportLabelActive: {
    color: COLORS.primary,
  },
  sportCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  previewBody: {
    flex: 1,
  },
  previewName: {
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  previewSub: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.errorLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.errorContainer,
    padding: 12,
    marginTop: 14,
  },
  errorText: {
    ...FONTS.bodySm,
    color: COLORS.error,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243,247,244,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  footerShell: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  ctaBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.primary,
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    ...FONTS.buttonLg,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surfaceWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '74%',
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...FONTS.headlineSm,
    color: COLORS.text,
    marginBottom: 14,
  },
  modalList: {
    maxHeight: 340,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  modalItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  modalItemText: {
    ...FONTS.labelLg,
    color: COLORS.textSecondary,
  },
  modalItemTextActive: {
    color: COLORS.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMd,
    color: COLORS.text,
    padding: 0,
  },
  emptyText: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
