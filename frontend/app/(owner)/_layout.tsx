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
  container: { flex: 1, backgroundColor: '#090d14' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14,
    paddingHorizontal: 20, backgroundColor: '#0d121c',
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, borderWidth: 1, borderColor: '#334155' },
  hamburger: { gap: 4, alignItems: 'flex-start' },
  hamLine: { height: 2.5, width: 22, backgroundColor: '#f1f5f9', borderRadius: 2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', shadowColor: '#4ade80', shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
  headerPageTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc', letterSpacing: 0.5 },
  exitBtn: { justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,8,12,0.8)', zIndex: 10 },
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH,
    backgroundColor: '#0d121c', zIndex: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    borderRightWidth: 1, borderRightColor: '#1e293b',
    shadowColor: '#000', shadowOffset: { width: 10, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  sidebarBrand: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingBottom: 24,
  },
  brandLogo: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(74,222,128,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  brandTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc', letterSpacing: 0.5 },
  brandSub: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  closeSidebarBtn: { marginLeft: 'auto', padding: 6, backgroundColor: '#1e293b', borderRadius: 10 },
  sidebarProfile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e293b',
  },
  sidebarAvatar: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#064e3b',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#4ade80',
  },
  sidebarAvatarText: { fontSize: 18, fontWeight: '800', color: '#4ade80' },
  sidebarProfileInfo: { flex: 1 },
  sidebarName: { fontSize: 15, fontWeight: '800', color: '#f8fafc', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', color: '#4ade80' },
  sidebarDivider: { height: 1, backgroundColor: '#1e293b', marginVertical: 24, marginHorizontal: 20 },
  menuGroupLabel: {
    fontSize: 11, fontWeight: '800', color: '#475569',
    letterSpacing: 2, paddingHorizontal: 24, marginBottom: 12,
  },
  sidebarMenu: { flex: 1, paddingHorizontal: 16 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, marginBottom: 6,
    position: 'relative',
  },
  menuItemActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#1e293b', borderWidth: 1 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTexts: { flex: 1, paddingRight: 10 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  activeIndicator: { width: 4, height: 24, borderRadius: 2, position: 'absolute', right: 0 },
  sidebarFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#0d121c' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.1)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
  },
  logoutIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(220,38,38,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoutLabel: { fontSize: 15, fontWeight: '800', color: '#f87171' },
  content: { flex: 1, position: 'relative' },
});
