import React, { useState, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Platform, Animated, Dimensions, StatusBar, ScrollView
} from 'react-native';
import { router, Slot, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from '../../store/profileStore';
import { TOKEN_KEY } from '../_layout';
import { API_BASE_URL } from '../../lib/api';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.78, 300);

const MENU = [
  { key: 'fields', icon: 'stadium', label: 'Lapangan Saya', route: '/(owner)/fields', color: '#4ade80' },
  { key: 'bookings', icon: 'receipt-long', label: 'Daftar Booking', route: '/(owner)/bookings', color: '#f59e0b' },
];

export default function OwnerLayout() {
  const profile = useProfileStore((s) => s.profile);
  const clearProfile = useProfileStore((s) => s.clearProfile);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const displayName = profile?.full_name || profile?.username || 'Owner';
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

  const navigate = (route: string) => {
    if (pathname !== route) {
      router.push(route as any);
    }
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

  const currentPage = MENU.find(m => m.route === pathname)?.label || 'Owner Panel';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080c10" />

      {/* Header */}
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
          <Text style={styles.headerPageTitle}>{currentPage}</Text>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerBtn}>
          <View style={styles.exitBtn}>
            <MaterialIcons name="exit-to-app" size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Overlay */}
      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeSidebar} />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarBrand}>
          <View style={styles.brandLogo}>
            <MaterialIcons name="store" size={20} color="#4ade80" />
          </View>
          <View>
            <Text style={styles.brandTitle}>GOAL Owner</Text>
            <Text style={styles.brandSub}>Business Panel</Text>
          </View>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeSidebarBtn}>
            <MaterialIcons name="close" size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarProfile}>
          <View style={styles.sidebarAvatar}>
            <Text style={styles.sidebarAvatarText}>{initials}</Text>
          </View>
          <View style={styles.sidebarProfileInfo}>
            <Text style={styles.sidebarName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.roleBadge}>
              <MaterialIcons name="verified" size={10} color="#4ade80" />
              <Text style={styles.roleBadgeText}>Mitra Owner</Text>
            </View>
          </View>
        </View>

        <View style={styles.sidebarDivider} />

        <Text style={styles.menuGroupLabel}>MENU</Text>
        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {MENU.map((item) => {
            const active = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => navigate(item.route)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: active ? item.color + '22' : '#1e293b' }]}>
                  <MaterialIcons name={item.icon as any} size={19} color={active ? item.color : '#64748b'} />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={[styles.menuLabel, active && { color: '#f1f5f9' }]}>{item.label}</Text>
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

      {/* Main Content Area */}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c10' },
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },
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
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#052e16', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: '#166534',
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#4ade80' },
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
  content: { flex: 1, position: 'relative' },
});
