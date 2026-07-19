import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Platform, Animated, Dimensions, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from '../../store/profileStore';
import { TOKEN_KEY } from '../_layout';
import { API_BASE_URL } from '../../lib/api';
import UserPage from '../../components/admin/UserPage';
import OwnerRequestPage from '../../components/admin/OwnerRequestPage';
import PendingFieldsPage from '../../components/admin/PendingFieldsPage';
import TrashedFieldsPage from '../../components/admin/TrashedFieldsPage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.78, 300);

type Page = 'users' | 'owner-requests' | 'fields-pending' | 'fields-trashed';

const MENU: { key: Page; icon: string; label: string; sublabel: string; role: string[]; color: string }[] = [
  { key: 'users', icon: 'people-alt', label: 'Kelola Pengguna', sublabel: 'Manajemen akun', role: ['admin', 'super_admin'], color: '#60a5fa' },
  { key: 'owner-requests', icon: 'inventory', label: 'Pengajuan Owner', sublabel: 'Review & approve', role: ['admin', 'super_admin'], color: '#f59e0b' },
  { key: 'fields-pending', icon: 'pending-actions', label: 'Lapangan Pending', sublabel: 'Verifikasi lapangan', role: ['super_admin'], color: '#a78bfa' },
  { key: 'fields-trashed', icon: 'auto-delete', label: 'Sampah Lapangan', sublabel: 'Kelola data terhapus', role: ['super_admin'], color: '#f87171' },
];

const PAGE_TITLES: Record<Page, string> = {
  'users': 'Kelola Pengguna',
  'owner-requests': 'Pengajuan Owner',
  'fields-pending': 'Lapangan Pending',
  'fields-trashed': 'Sampah Lapangan',
};

export default function AdminDashboardScreen() {
  const profile = useProfileStore((s) => s.profile);
  const clearProfile = useProfileStore((s) => s.clearProfile);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('users');
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const role = profile?.role || '';
  const displayName = profile?.full_name || profile?.username || 'Admin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: -SIDEBAR_WIDTH, useNativeDriver: true, damping: 25, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
    closeSidebar();
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    } catch {}
    await AsyncStorage.removeItem(TOKEN_KEY);
    clearProfile();
    router.replace('/login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'users': return <UserPage />;
      case 'owner-requests': return <OwnerRequestPage />;
      case 'fields-pending': return <PendingFieldsPage />;
      case 'fields-trashed': return <TrashedFieldsPage />;
      default: return <UserPage />;
    }
  };

  const currentMenu = MENU.find(m => m.key === currentPage);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080c10" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openSidebar} style={styles.headerBtn}>
          <View style={styles.hamburger}>
            <View style={styles.hamLine} />
            <View style={[styles.hamLine, { width: 16 }]} />
            <View style={styles.hamLine} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerDot} />
          <Text style={styles.headerPageTitle}>{PAGE_TITLES[currentPage]}</Text>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerBtn}>
          <View style={styles.exitBtn}>
            <MaterialIcons name="exit-to-app" size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Overlay ── */}
      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeSidebar} />
        </Animated.View>
      )}

      {/* ── Sidebar ── */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        {/* Brand */}
        <View style={styles.sidebarBrand}>
          <View style={styles.brandLogo}>
            <MaterialIcons name="shield" size={20} color="#4ade80" />
          </View>
          <View>
            <Text style={styles.brandTitle}>GOAL Admin</Text>
            <Text style={styles.brandSub}>Control Panel</Text>
          </View>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeSidebarBtn}>
            <MaterialIcons name="close" size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <View style={styles.sidebarProfile}>
          <View style={styles.sidebarAvatar}>
            <Text style={styles.sidebarAvatarText}>{initials}</Text>
          </View>
          <View style={styles.sidebarProfileInfo}>
            <Text style={styles.sidebarName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.superBadge}>
              <MaterialIcons name="verified" size={10} color="#4ade80" />
              <Text style={styles.superBadgeText}>{role === 'super_admin' ? 'Super Admin' : 'Admin'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sidebarDivider} />

        {/* Menu */}
        <Text style={styles.menuGroupLabel}>NAVIGASI</Text>
        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {MENU.filter(m => m.role.includes(role)).map((item) => {
            const active = currentPage === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => navigate(item.key)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: active ? item.color + '22' : '#1e293b' }]}>
                  <MaterialIcons name={item.icon as any} size={19} color={active ? item.color : '#64748b'} />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={[styles.menuLabel, active && { color: '#f1f5f9' }]}>{item.label}</Text>
                  <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                </View>
                {active && <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <View style={styles.logoutIconWrap}>
              <MaterialIcons name="power-settings-new" size={18} color="#f87171" />
            </View>
            <Text style={styles.logoutLabel}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Content ── */}
      <View style={styles.content}>{renderPage()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c10' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14,
    paddingHorizontal: 16, backgroundColor: '#0d1117',
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  hamburger: { gap: 5, alignItems: 'flex-start' },
  hamLine: { height: 2, width: 22, backgroundColor: '#e2e8f0', borderRadius: 2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  headerPageTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', letterSpacing: 0.3 },
  exitBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#1e293b',
    justifyContent: 'center', alignItems: 'center',
  },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },

  // Sidebar
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH,
    backgroundColor: '#0d1117', zIndex: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    borderRightWidth: 1, borderRightColor: '#1e293b',
  },
  sidebarBrand: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 20,
  },
  brandLogo: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: '#0f2a1a',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#166534',
  },
  brandTitle: { fontSize: 15, fontWeight: '800', color: '#f1f5f9' },
  brandSub: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  closeSidebarBtn: { marginLeft: 'auto', padding: 4 },

  sidebarProfile: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, padding: 14,
    backgroundColor: '#1e293b', borderRadius: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  sidebarAvatar: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: '#14532d',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#4ade80',
  },
  sidebarAvatarText: { fontSize: 17, fontWeight: '800', color: '#4ade80' },
  sidebarProfileInfo: { flex: 1 },
  sidebarName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  superBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#052e16', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: '#166534',
  },
  superBadgeText: { fontSize: 10, fontWeight: '700', color: '#4ade80' },
  sidebarDivider: { height: 1, backgroundColor: '#1e293b', marginVertical: 18, marginHorizontal: 16 },

  menuGroupLabel: {
    fontSize: 10, fontWeight: '800', color: '#334155',
    letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 6,
  },
  sidebarMenu: { flex: 1, paddingHorizontal: 10 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, marginBottom: 4,
    position: 'relative',
  },
  menuItemActive: { backgroundColor: '#1e293b' },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuTexts: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  menuSublabel: { fontSize: 11, color: '#334155', marginTop: 1 },
  activeIndicator: { width: 3, height: 22, borderRadius: 2, position: 'absolute', right: 0 },

  sidebarFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, backgroundColor: '#1e1015',
    borderWidth: 1, borderColor: '#3f1212',
  },
  logoutIconWrap: {
    width: 32, height: 32, borderRadius: 9, backgroundColor: '#2d0f0f',
    justifyContent: 'center', alignItems: 'center',
  },
  logoutLabel: { fontSize: 14, fontWeight: '700', color: '#f87171' },

  content: { flex: 1 },
});
