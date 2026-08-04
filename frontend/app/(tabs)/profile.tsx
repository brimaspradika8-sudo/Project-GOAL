import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';
import * as SecureStore from '../../lib/secureStorage';
import { TOKEN_KEY } from '../../lib/auth';
import { API_BASE_URL, DEFAULT_HEADERS } from '../../lib/api';
import { SIZES, FONTS, SHADOWS } from '../../components/goalTheme';
import AuthInput from '../../components/AuthInput';
import { useTheme } from '../../lib/theme';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import AlertBox from '../../components/shared/AlertBox';
import NotificationCenter from '../../components/shared/NotificationCenter';
import { useToastStore } from '../../store/toastStore';
import { useNotificationStore } from '../../store/notificationStore';
import { fieldError } from '../../lib/formValidation';

const SPORT_ICONS: Record<string, string> = {
  futsal: 'sports-soccer',
  basketball: 'sports-basketball',
  badminton: 'sports-tennis',
  volleyball: 'sports-volleyball',
  mini_soccer: 'sports-soccer',
  tennis: 'sports-tennis',
  padel: 'sports',
  other: 'more-horiz',
};

type OwnerRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const { profile, clearProfile, fetchProfile } = useProfileStore();
  const { colors, resolved } = useTheme();
  const isDark = resolved === 'dark';
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [ownerStatus, setOwnerStatus] = useState<OwnerRequestStatus>('none');
  const [ownerRequestData, setOwnerRequestData] = useState<any>(null);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', business_name: '', address: '', phone: '' });
  const [ownerErrors, setOwnerErrors] = useState({ name: '', email: '', business_name: '', address: '', phone: '' });
  const [ownerTouched, setOwnerTouched] = useState({ name: false, email: false, business_name: false, address: false, phone: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { refresh: refreshNotifications, clear: clearNotifications, unreadCount } = useNotificationStore();

  useEffect(() => {
    refreshNotifications().catch(() => {});
  }, [refreshNotifications]);

  const ownValidateName = (v: string) => { if (!v.trim()) return 'Nama wajib diisi.'; if (v.trim().length > 255) return 'Nama maksimal 255 karakter.'; return ''; };
  const ownValidateEmail = (v: string) => { if (!v.trim()) return 'Email wajib diisi.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Format email tidak valid.'; return ''; };
  const ownValidateBiz = (v: string) => { if (!v.trim()) return 'Nama usaha wajib diisi.'; if (v.trim().length > 255) return 'Nama usaha maksimal 255 karakter.'; return ''; };
  const ownValidateAddr = (v: string) => { if (!v.trim()) return 'Alamat wajib diisi.'; if (v.trim().length > 500) return 'Alamat maksimal 500 karakter.'; return ''; };
  const ownValidatePhone = (v: string) => { const t = v.trim(); if (!t) return 'Nomor telepon wajib diisi.'; if (!/^\d+$/.test(t)) return 'Nomor telepon hanya boleh berisi angka.'; if (t.length < 8) return 'Nomor telepon minimal 8 digit.'; if (t.length > 15) return 'Nomor telepon maksimal 15 digit.'; return ''; };

  const setOwnErr = (key: keyof typeof ownerErrors) => (err: string) => setOwnerErrors(p => ({ ...p, [key]: err }));
  const onOwnField = (key: keyof typeof ownerErrors, validate: (v: string) => string) => (v: string) => {
    setOwnerForm(p => ({ ...p, [key]: v }));
    setOwnErr(key)(fieldError(v, validate(v), ownerTouched[key]));
  };
  const onOwnBlur = (key: keyof typeof ownerErrors, validate: (v: string) => string) => () => {
    setOwnerTouched(p => ({ ...p, [key]: true }));
    setOwnErr(key)(validate(ownerForm[key]));
  };

  const openOwnerModal = () => {
    setSubmitError(null);
    setOwnerErrors({ name: '', email: '', business_name: '', address: '', phone: '' });
    setOwnerTouched({ name: false, email: false, business_name: false, address: false, phone: false });
    setShowOwnerModal(true);
  };

  const fetchOwnerStatus = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${API_BASE_URL}/me/owner-request`, {
        headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.status) {
        setOwnerStatus(data.status);
        setOwnerRequestData(data);
      } else {
        setOwnerStatus('none');
      }
    } catch {
      // network error — silent
    }
  }, []);

  useEffect(() => {
    fetchOwnerStatus();
  }, [fetchOwnerStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchOwnerStatus(), refreshNotifications()]);
    setRefreshing(false);
  }, [fetchProfile, fetchOwnerStatus, refreshNotifications]);

  useEffect(() => {
    if (profile) {
      setOwnerForm((prev) => ({
        ...prev,
        name: profile.full_name || '',
        email: profile.email || '',
      }));
    }
  }, [profile]);

  async function handleSubmitOwner() {
    setOwnerTouched({ name: true, email: true, business_name: true, address: true, phone: true });
    const nErr = ownValidateName(ownerForm.name);
    const eErr = ownValidateEmail(ownerForm.email);
    const bErr = ownValidateBiz(ownerForm.business_name);
    const aErr = ownValidateAddr(ownerForm.address);
    const pErr = ownValidatePhone(ownerForm.phone);
    setOwnerErrors({ name: nErr, email: eErr, business_name: bErr, address: aErr, phone: pErr });
    if (nErr || eErr || bErr || aErr || pErr) {
      setSubmitError('Periksa kembali isian Anda.');
      return;
    }

    const trimmedName = ownerForm.name.trim();
    const trimmedEmail = ownerForm.email.trim();
    const trimmedBusiness = ownerForm.business_name.trim();
    const trimmedAddress = ownerForm.address.trim();
    const trimmedPhone = ownerForm.phone.trim();
    setOwnerForm({ name: trimmedName, email: trimmedEmail, business_name: trimmedBusiness, address: trimmedAddress, phone: trimmedPhone });

    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/me/owner-request`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ownerForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : data.message || 'Gagal mengirim pengajuan.';
        setSubmitError(msg);
        return;
      }
      setShowOwnerModal(false);
      setOwnerStatus('pending');
      setOwnerRequestData(data);
      useToastStore.getState().show({ type: 'success', title: 'Berhasil', description: 'Pengajuan owner berhasil dikirim. Menunggu persetujuan admin.' });
    } catch {
      setSubmitError('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleSignOut = () => {
    setShowLogoutConfirm(true);
  };

  const doActualLogout = async () => {
    setLogoutLoading(true);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await clearProfile();
      clearNotifications();
      router.replace('/login');
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Terjadi kesalahan saat keluar akun.' });
    } finally {
      setLogoutLoading(false);
    }
  };

  const styles = makeStyles(colors, isDark);
  const role = profile?.role;
  const isDesktop = width >= 900;

  // ================================================================
  // Kartu Pengajuan Owner – selalu tampil untuk semua role
  // Warna dinamis: dark mode = #1E293B bg + teks putih
  //                light mode = bg terang + teks gelap
  // ================================================================
  function renderOwnerSection() {
    // ----- PLAYER: pending -----
    if (role === 'player' && ownerStatus === 'pending') {
      return (
        <View style={[styles.ownerCard, {
            backgroundColor: colors.warningMuted,
            borderColor: colors.warning + '50',
        }]}>
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: colors.warningMuted }]}>
              <MaterialIcons name="hourglass-top" size={20} color={colors.warning} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Pengajuan Owner</Text>
              <Text style={styles.ownerCardDesc}>Menunggu persetujuan admin...</Text>
            </View>
          </View>
        </View>
      );
    }

    // ----- PLAYER: rejected -----
    if (role === 'player' && ownerStatus === 'rejected') {
      return (
        <TouchableOpacity
          style={[styles.ownerCard, { backgroundColor: colors.destructiveMuted, borderColor: colors.destructive + '40' }]}
          activeOpacity={0.8}
          onPress={() => openOwnerModal()}
        >
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: colors.destructiveMuted }]}>
              <MaterialIcons name="cancel" size={20} color={colors.error} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Pengajuan Ditolak</Text>
              <Text style={styles.ownerCardDesc} numberOfLines={2} ellipsizeMode="tail">
                {ownerRequestData?.rejection_reason ?? 'Ketuk untuk ajukan ulang.'}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.error} />
        </TouchableOpacity>
      );
    }

    // ----- PLAYER: none (belum mengajukan) -----
    if (role === 'player') {
      return (
        <TouchableOpacity
          style={[styles.ownerCard, {
            backgroundColor: colors.primaryMuted,
            borderColor: colors.primary + '40',
          }]}
          activeOpacity={0.8}
          onPress={() => openOwnerModal()}
        >
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: colors.primaryMuted }]}>
              <MaterialIcons name="store" size={20} color={colors.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Ajukan Jadi Owner</Text>
              <Text style={styles.ownerCardDesc}>Kelola lapangan Anda sendiri.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    // ----- OWNER -----
    if (role === 'owner') {
      return (
        <TouchableOpacity
          style={[styles.ownerCard, {
            backgroundColor: colors.primaryMuted,
            borderColor: colors.primary + '40',
          }]}
          activeOpacity={0.8}
          onPress={() => router.push('/(owner)/fields' as any)}
        >
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: colors.primaryMuted }]}>
              <MaterialIcons name="stadium" size={20} color={colors.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Lapangan Saya</Text>
              <Text style={styles.ownerCardDesc}>Kelola lapangan yang Anda miliki.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    // ----- SUPER ADMIN -----
    if (role === 'super_admin') {
      return (
        <TouchableOpacity
          style={[styles.ownerCard, {
            backgroundColor: colors.surfaceContainerHigh,
            borderColor: colors.outline,
          }]}
          activeOpacity={0.8}
          onPress={() => router.push('/(admin)/dashboard')}
        >
          <View style={styles.ownerCardLeft}>
            <View style={[styles.ownerIconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="admin-panel-settings" size={20} color={colors.primary} />
            </View>
            <View style={styles.ownerCardInfo}>
              <Text style={styles.ownerCardTitle}>Panel Super Admin</Text>
              <Text style={styles.ownerCardDesc}>Approve field dan owner request.</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.pageShell}>
          <Text style={styles.pageTitle}>Profil</Text>

          <View style={[styles.profileGrid, isDesktop && styles.profileGridDesktop]}>
            {/* ===== KOLOM KIRI: Profil + OLAHRAGA + Owner Card ===== */}
            <View style={[styles.profileColumn, isDesktop && { flex: 1 }]}>
              <View style={styles.profileCard}>
                <Image
                  source={{ uri: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/png?seed=goal&backgroundColor=ffffff&textColor=00A651' }}
                  style={styles.avatar}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
                    {profile?.full_name ?? profile?.username ?? 'Pengguna'}
                  </Text>
                  {profile?.username ? (
                    <Text style={styles.profileHandle} numberOfLines={1} ellipsizeMode="tail">
                      @{profile.username}
                    </Text>
                  ) : null}
                  <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                    <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                      {profile?.region ?? 'Belum diatur'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => router.push('/onboarding')}>
                  <MaterialIcons name="edit" size={16} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>

              {profile?.role && (
                <View style={styles.roleBadge}>
                  <MaterialIcons
                    name={profile.role === 'super_admin' ? 'shield' : profile.role === 'owner' ? 'store' : 'person'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.roleBadgeText}>
                    {profile.role === 'super_admin' ? 'SUPER ADMIN' : profile.role === 'owner' ? 'OWNER' : 'PLAYER'}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>OLAHRAGA</Text>
              <View style={styles.sportsCard}>
                {profile?.sports?.length ? (
                  <View style={styles.tagsRow}>
                    {profile.sports.map((sport: string) => (
                      <View key={sport} style={styles.tagChip}>
                        <MaterialIcons name={(SPORT_ICONS[sport] ?? 'sports') as any} size={14} color={colors.primary} />
                        <Text style={styles.tagText}>{sport.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>Belum ada preferensi olahraga.</Text>
                )}
              </View>

              {/* ===== KARTU PENGAJUAN OWNER – tepat di bawah OLAHRAGA ===== */}
              {renderOwnerSection()}
            </View>

            {/* ===== KOLOM KANAN: Pengaturan ===== */}
            <View style={[styles.profileColumn, isDesktop && { flex: 1 }]}>
              <Text style={styles.sectionTitle}>PENGATURAN</Text>
              <View style={styles.settingsCard}>
                <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => router.push('/onboarding')}>
                  <View style={styles.settingIconBox}>
                    <MaterialIcons name="person-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.settingLabel}>Ubah Profil</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.8}
                  onPress={() => setShowNotifications(true)}
                >
                  <View style={styles.settingIconBox}>
                    <MaterialIcons name="notifications-none" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.settingLabel}>Notifikasi</Text>
                  {unreadCount() > 0 ? (
                    <View style={styles.notifBadgeCount}>
                      <Text style={styles.notifBadgeText}>{unreadCount() > 99 ? '99+' : unreadCount()}</Text>
                    </View>
                  ) : null}
                  <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow} activeOpacity={0.8} onPress={() => router.push('/change-password')}>
                  <View style={styles.settingIconBox}>
                    <MaterialIcons name="lock-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.settingLabel}>Ubah Kata Sandi</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.8}
                  onPress={() => useToastStore.getState().show({ type: 'info', title: 'Segera Hadir', description: 'Pusat bantuan akan segera tersedia.' })}
                >
                  <View style={styles.settingIconBox}>
                    <MaterialIcons name="help-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.settingLabel}>Pusat Bantuan</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
                <MaterialIcons name="logout" size={20} color={colors.error} />
                <Text style={styles.signOutText}>Keluar Akun</Text>
              </TouchableOpacity>

              <Text style={styles.version}>GOAL v1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ===== MODAL AJUKAN OWNER ===== */}
      <Modal visible={showOwnerModal} transparent animationType="fade" onRequestClose={() => setShowOwnerModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowOwnerModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ajukan Jadi Owner</Text>
                <Text style={styles.modalSubtitle}>Isi data usaha Anda untuk menjadi owner lapangan.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOwnerModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ alignSelf: 'flex-start' }}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {submitError ? (
              <AlertBox type="error" title={submitError} style={styles.alertBox} />
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AuthInput
          label="Nama Lengkap"
          icon="person-outline"
          value={ownerForm.name}
          onChangeText={onOwnField('name', ownValidateName)}
          onBlur={onOwnBlur('name', ownValidateName)}
          containerStyle={styles.inputContainer}
          error={ownerErrors.name}
        />
        <AuthInput
          label="Email"
          icon="mail-outline"
          value={ownerForm.email}
          onChangeText={onOwnField('email', ownValidateEmail)}
          onBlur={onOwnBlur('email', ownValidateEmail)}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.inputContainer}
          error={ownerErrors.email}
        />
        <AuthInput
          label="Nama Usaha"
          icon="store"
          value={ownerForm.business_name}
          onChangeText={onOwnField('business_name', ownValidateBiz)}
          onBlur={onOwnBlur('business_name', ownValidateBiz)}
          containerStyle={styles.inputContainer}
          error={ownerErrors.business_name}
        />
        <AuthInput
          label="Alamat"
          icon="location-on"
          value={ownerForm.address}
          onChangeText={onOwnField('address', ownValidateAddr)}
          onBlur={onOwnBlur('address', ownValidateAddr)}
          containerStyle={styles.inputContainer}
          error={ownerErrors.address}
        />
        <AuthInput
          label="Nomor Telepon"
          icon="phone"
          value={ownerForm.phone}
          onChangeText={onOwnField('phone', ownValidatePhone)}
          onBlur={onOwnBlur('phone', ownValidatePhone)}
          keyboardType="phone-pad"
          containerStyle={styles.inputContainer}
          error={ownerErrors.phone}
        />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOwnerModal(false)} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitOwner}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.submitText}>Kirim Pengajuan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Keluar Akun"
        description="Yakin ingin keluar dari akun?"
        confirmLabel="Keluar"
        destructive
        loading={logoutLoading}
        onConfirm={doActualLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <NotificationCenter visible={showNotifications} onClose={() => setShowNotifications(false)} />
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageShell: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  profileGrid: {
    gap: 0,
  },
  profileGridDesktop: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  profileColumn: {},
  pageTitle: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: colors.text,
    marginBottom: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    ...FONTS.headlineSm,
    fontSize: 17,
    color: colors.text,
    marginBottom: 2,
  },
  profileHandle: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  roleBadgeText: {
    ...FONTS.labelMd,
    color: colors.text,
  },
  sectionTitle: {
    ...FONTS.labelMd,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  sportsCard: {
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 0,
  },
  tagText: {
    ...FONTS.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  emptyText: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
  },
  // === Owner Card base – warna diatur via inline style di JSX ===
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  ownerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  ownerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerCardInfo: {
    flex: 1,
  },
  ownerCardTitle: {
    ...FONTS.headlineSm,
    fontSize: 14,
    color: colors.text,
  },
  ownerCardDesc: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 4,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notifBadgeText: {
    ...FONTS.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  settingLabel: {
    flex: 1,
    ...FONTS.bodyMd,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 0,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  signOutText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: colors.error,
  },
  version: {
    ...FONTS.bodySm,
    color: colors.outline,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: isDark ? colors.outline : colors.outline,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    ...FONTS.headlineMd,
    fontSize: 20,
    color: colors.text,
  },
  modalSubtitle: {
    ...FONTS.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  inputContainer: {
    marginBottom: 16,
  },
  alertBox: {
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
  },
  cancelText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
