import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/profileStore';
import { FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import HelpCenterModal from './HelpCenterModal';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../lib/theme';
import { useIsMobileWeb } from '../../lib/responsive';
import { logout } from '../../lib/session';
import { apiFetch } from '../../lib/apiClient';

export default function OwnerProfilePage() {
  const { profile } = useProfileStore();
  const { colors, resolved } = useTheme();
  const isMobile = useIsMobileWeb();
  const st = React.useMemo(() => makeStyles(colors, resolved, isMobile), [colors, resolved, isMobile]);
  const initials = (profile?.full_name || profile?.username || 'O').charAt(0).toUpperCase();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Business statistics & venue info state
  const [businessInfo, setBusinessInfo] = useState<{
    business_name?: string;
    fieldsCount: number;
    pendingBookings: number;
    confirmedBookings: number;
    loading: boolean;
  }>({
    fieldsCount: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadOwnerStats() {
      try {
        const [fieldsRes, bookingsRes, reqRes] = await Promise.all([
          apiFetch('/owner/fields').catch(() => null),
          apiFetch('/owner/bookings').catch(() => null),
          apiFetch('/me/owner-request').catch(() => null),
        ]);

        let fieldsCount = 0;
        if (fieldsRes && fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          fieldsCount = Array.isArray(fieldsData?.data) ? fieldsData.data.length : Array.isArray(fieldsData) ? fieldsData.length : 0;
        }

        let pendingBookings = 0;
        let confirmedBookings = 0;
        if (bookingsRes && bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          const list = Array.isArray(bookingsData?.data) ? bookingsData.data : Array.isArray(bookingsData) ? bookingsData : [];
          pendingBookings = list.filter((b: any) => b.status === 'pending').length;
          confirmedBookings = list.filter((b: any) => b.status === 'approved' || b.status === 'confirmed').length;
        }

        let business_name = '';
        if (reqRes && reqRes.ok) {
          const reqData = await reqRes.json();
          business_name = reqData?.data?.business_name || reqData?.business_name || '';
        }

        if (isMounted) {
          setBusinessInfo({
            business_name,
            fieldsCount,
            pendingBookings,
            confirmedBookings,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setBusinessInfo((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    loadOwnerStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const doActualLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } catch {
      useToastStore.getState().show({ type: 'error', title: 'Gagal', description: 'Terjadi kesalahan saat keluar akun.' });
    } finally {
      setLogoutLoading(false);
    }
  };

  const MENU_ITEMS = [
    {
      icon: 'person-outline' as const,
      label: 'Ubah Profil Akun',
      sublabel: 'Nama, Email, & Foto Profil',
      onPress: () => router.push('/onboarding'),
    },
    {
      icon: 'help-outline' as const,
      label: 'Pusat Bantuan Owner',
      sublabel: 'FAQ & Hubungi CS',
      badge: 'Bantuan',
      onPress: () => setShowHelpModal(true),
    },
  ];

  return (
    <View style={st.screen}>
      <DashboardHeader
        title="Profil Owner"
        subtitle="Kelola bisnis olahraga & akun Mitra GOAL"
        showBack={false}
      />
      <ScrollView
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Card Premium Profile */}
        <View style={st.profileHeaderCard}>
          <View style={st.gradientBg} />
          <View style={st.profileHeaderTop}>
            <View style={st.avatarContainer}>
              <View style={st.avatarCircle}>
                <Text style={st.avatarText}>{initials}</Text>
              </View>
              <View style={st.onlineBadge} />
            </View>

            <View style={st.profileMainInfo}>
              <View style={st.roleBadge}>
                <MaterialIcons name="verified-user" size={14} color="#00e676" />
                <Text style={st.roleBadgeText}>Mitra Owner Resmi</Text>
              </View>
              <Text style={st.profileName} numberOfLines={1}>
                {profile?.full_name || profile?.username || 'Owner Goal'}
              </Text>
              <Text style={st.profileEmail} numberOfLines={1}>
                {profile?.email || '-'}
              </Text>
              {!!businessInfo.business_name && (
                <View style={st.businessNameTag}>
                  <MaterialIcons name="storefront" size={14} color={colors.primary} />
                  <Text style={st.businessNameText} numberOfLines={1}>{businessInfo.business_name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Business Summary Quick Stats */}
          <View style={st.statsRow}>
            <TouchableOpacity style={st.statItem} onPress={() => router.push('/(owner)/fields')}>
              <MaterialIcons name="stadium" size={20} color={colors.primary} />
              <Text style={st.statValue}>
                {businessInfo.loading ? <ActivityIndicator size="small" color={colors.primary} /> : businessInfo.fieldsCount}
              </Text>
              <Text style={st.statLabel}>Lapangan</Text>
            </TouchableOpacity>

            <View style={st.statDivider} />

            <TouchableOpacity style={st.statItem} onPress={() => router.push('/(owner)/bookings')}>
              <MaterialIcons name="pending-actions" size={20} color="#ff9800" />
              <Text style={st.statValue}>
                {businessInfo.loading ? <ActivityIndicator size="small" color="#ff9800" /> : businessInfo.pendingBookings}
              </Text>
              <Text style={st.statLabel}>Perlu Review</Text>
            </TouchableOpacity>

            <View style={st.statDivider} />

            <TouchableOpacity style={st.statItem} onPress={() => router.push('/(owner)/bookings')}>
              <MaterialIcons name="check-circle-outline" size={20} color="#4caf50" />
              <Text style={st.statValue}>
                {businessInfo.loading ? <ActivityIndicator size="small" color="#4caf50" /> : businessInfo.confirmedBookings}
              </Text>
              <Text style={st.statLabel}>Disetujui</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shortcut Banner to Help Center */}
        <TouchableOpacity
          style={st.helpBanner}
          onPress={() => setShowHelpModal(true)}
          activeOpacity={0.85}
        >
          <View style={st.helpBannerIcon}>
            <MaterialIcons name="support-agent" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.helpBannerTitle}>Pusat Bantuan & Layanan CS</Text>
            <Text style={st.helpBannerSub}>Butuh bantuan mengelola booking atau lapangan?</Text>
          </View>
          <View style={st.helpBannerAction}>
            <Text style={st.helpBannerActionText}>Buka</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Menu Section */}
        <Text style={st.sectionTitle}>PENGATURAN & LAYANAN</Text>
        <View style={st.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={st.menuRow} onPress={item.onPress} activeOpacity={0.75}>
                <View style={st.menuIconBox}>
                  <MaterialIcons name={item.icon} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={st.menuLabel}>{item.label}</Text>
                    {item.badge && (
                      <View style={st.menuBadge}>
                        <Text style={st.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={st.menuSublabel}>{item.sublabel}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
              </TouchableOpacity>
              {idx < MENU_ITEMS.length - 1 && <View style={st.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={st.signOutBtn} onPress={() => setShowLogoutConfirm(true)} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={st.signOutText}>Keluar Akun</Text>
        </TouchableOpacity>

        <Text style={st.version}>GOAL Partner App v1.2.0 • Build 2026</Text>
      </ScrollView>

      {/* Pusat Bantuan Modal */}
      <HelpCenterModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Keluar Akun"
        description="Yakin ingin keluar dari akun Owner?"
        confirmLabel="Keluar"
        destructive
        loading={logoutLoading}
        onConfirm={doActualLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], resolved: 'light' | 'dark', isMobile: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: SIZES.padding, paddingBottom: 60, ...(isMobile ? {} : { maxWidth: 680, alignSelf: 'center', width: '100%' }) },

  profileHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradientBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 85,
    backgroundColor: resolved === 'dark' ? '#1b3b2b' : '#e6f4ea',
    opacity: 0.8,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    ...SHADOWS.sm,
  },
  avatarText: { ...FONTS.headlineLg, color: colors.primary, fontWeight: '800' },
  onlineBadge: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: '#00e676',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileMainInfo: { flex: 1 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: resolved === 'dark' ? '#0d3822' : '#d7f5e3',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleBadgeText: { ...FONTS.labelSm, color: '#008744', fontWeight: '700' },
  profileName: { ...FONTS.headlineSm, color: colors.text, fontWeight: '700', marginBottom: 2 },
  profileEmail: { ...FONTS.bodySm, color: colors.textSecondary, marginBottom: 6 },
  businessNameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  businessNameText: { ...FONTS.labelSm, color: colors.primary, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: resolved === 'dark' ? colors.surfaceContainerHigh : colors.surfaceContainerLow,
    borderRadius: SIZES.borderRadiusLg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.outline + '40',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    ...FONTS.headlineSm,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    ...FONTS.labelSm,
    color: colors.textSecondary,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.outline,
  },

  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: SIZES.borderRadiusLg,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  helpBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpBannerTitle: {
    ...FONTS.bodyMd,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  helpBannerSub: {
    ...FONTS.bodySm,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  helpBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  helpBannerActionText: {
    ...FONTS.labelSm,
    color: '#fff',
    fontWeight: '700',
  },

  sectionTitle: {
    ...FONTS.labelSm,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 24,
    paddingVertical: 4,
    ...SHADOWS.sm,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingHorizontal: 16, paddingVertical: 14,
    minHeight: 60,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: resolved === 'dark' ? colors.surfaceContainerHigh : colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { ...FONTS.bodyMd, fontWeight: '700', color: colors.text },
  menuSublabel: { ...FONTS.bodySm, color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  menuBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  menuBadgeText: {
    ...FONTS.labelSm,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  divider: { height: 1, backgroundColor: colors.outline, marginHorizontal: 16 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1.5, borderColor: colors.errorContainer,
    paddingVertical: 15, marginBottom: 20,
    backgroundColor: colors.surface,
  },
  signOutText: { ...FONTS.bodyMd, fontWeight: '700', color: colors.error },
  version: { ...FONTS.bodySm, color: colors.outline, textAlign: 'center' },
});
