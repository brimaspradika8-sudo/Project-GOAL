import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../goalTheme';
import ThemeToggle from '../ThemeToggle';
import { useProfileStore } from '../../store/profileStore';
import { SafeImage } from '../SafeImage';

export interface SidebarItem {
  href: string;
  label: string;
  icon: string;
  badge?: number | string;
  section?: string;
  isExternal?: boolean;
}

interface SidebarProps {
  title: string;
  accentColor: string;
  items: SidebarItem[];
  roleBadge?: string;
}

interface SidebarMenuItemProps {
  item: SidebarItem;
  active: boolean;
  activeColor: string;
  activeBg: string;
  inactiveColor: string;
  onPress: () => void;
}

export function getComparableRoute(path: string) {
  return path.replace(/\/\([^/]+\)/g, '') || '/';
}

export function isSidebarRouteActive(pathname: string, href: string) {
  const currentRoute = getComparableRoute(pathname);
  const itemRoute = getComparableRoute(href);

  return currentRoute === itemRoute || currentRoute.startsWith(itemRoute + '/');
}

export function SidebarMenuItem({
  item,
  active,
  activeColor,
  activeBg,
  inactiveColor,
  onPress,
}: SidebarMenuItemProps) {
  const { resolved } = useTheme();
  const itemColor = active ? (resolved === 'dark' ? '#FFFFFF' : activeColor) : inactiveColor;

  return (
    <Pressable
      key={item.href}
      style={[
        styles.menuItem,
        active && {
          backgroundColor: activeBg,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <MaterialIcons
          name={item.icon as any}
          size={19}
          color={itemColor}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.menuLabel,
            {
              color: itemColor,
              fontWeight: active ? '700' : '500',
            },
          ]}
        >
          {item.label}
        </Text>
      </View>

      {item.badge !== undefined && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}

      {item.isExternal && (
        <MaterialIcons
          name="open-in-new"
          size={14}
          color={inactiveColor}
          style={{ opacity: 0.7 }}
        />
      )}
    </Pressable>
  );
}

export default function Sidebar({ title, accentColor, items, roleBadge }: SidebarProps) {
  const { colors, resolved } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const clearProfile = useProfileStore((s) => s.clearProfile);
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (Platform.OS !== 'web') return null;

  const isDark = resolved === 'dark';
  
  // High contrast Railway-style dark palette
  const sidebarBg = isDark ? '#111018' : '#F8FAFC';
  const cardBg = isDark ? '#191724' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(255,255,255,0.07)' : colors.outline;
  
  const activeColor = accentColor;
  const inactiveColor = isDark ? '#94A3B8' : '#475569';
  const activeBg = isDark ? '#232034' : accentColor + '18';

  const userDisplayName = profile?.full_name || profile?.username || 'Pengguna';
  const userEmail = profile?.email || (profile?.username ? `@${profile.username}` : 'admin@goal.com');
  const roleTitle = roleBadge || (profile?.role === 'super_admin' ? 'SUPER ADMIN' : profile?.role === 'owner' ? 'OWNER' : 'USER');

  // Group items by section if provided
  const groupedItems = items.reduce((acc, item) => {
    const sectionName = item.section || 'UTAMA';
    if (!acc[sectionName]) acc[sectionName] = [];
    acc[sectionName].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const handleLogout = async () => {
    await clearProfile();
    router.replace('/login');
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: sidebarBg,
          borderRightColor: borderCol,
        },
      ]}
    >
      {/* 1. App Logo Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <View style={styles.brandRow}>
          <View style={[styles.logoIconBg, { backgroundColor: isDark ? '#262338' : colors.primaryContainer }]}>
            <MaterialIcons name="sports-soccer" size={20} color={isDark ? '#FFFFFF' : colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.logoText, { color: isDark ? '#FFFFFF' : colors.text }]}>GOAL</Text>
            <Text style={[styles.panelSubtitle, { color: isDark ? '#94A3B8' : colors.textSecondary }]}>
              {title}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Workspace Profile Banner (Railway Style) */}
      <View style={styles.workspaceSection}>
        <View style={[styles.workspaceCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <SafeImage
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImg}
                fallbackSize={20}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitial}>{userDisplayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.workspaceInfo}>
            <Text numberOfLines={1} style={[styles.workspaceName, { color: isDark ? '#FFFFFF' : colors.text }]}>
              {userDisplayName}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
                <Text style={[styles.roleBadgeText, { color: isDark ? '#34D399' : '#15803D' }]}>
                  {roleTitle}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Grouped Navigation Menu */}
      <View style={styles.menuScroll}>
        {Object.entries(groupedItems).map(([section, sectionItems], index) => (
          <View key={section} style={styles.sectionBlock}>
            {Object.keys(groupedItems).length > 1 && (
              <Text style={[styles.sectionTitle, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                {section}
              </Text>
            )}
            {sectionItems.map((item) => {
              const active = isSidebarRouteActive(pathname, item.href);
              return (
                <SidebarMenuItem
                  key={item.href}
                  item={item}
                  active={active}
                  activeColor={activeColor}
                  activeBg={activeBg}
                  inactiveColor={inactiveColor}
                  onPress={() => router.push(item.href as any)}
                />
              );
            })}
            {index < Object.keys(groupedItems).length - 1 && (
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
            )}
          </View>
        ))}
      </View>

      {/* Popover User Options Menu */}
      {showUserMenu && (
        <View style={[styles.userMenuPopover, { backgroundColor: isDark ? '#1D1B2A' : '#FFFFFF', borderColor: borderCol }]}>
          <TouchableOpacity
            style={styles.popoverItem}
            onPress={() => {
              setShowUserMenu(false);
              const target = profile?.role === 'super_admin' ? '/(super-admin)/profile' : '/(owner)/profile';
              router.push(target as any);
            }}
          >
            <MaterialIcons name="person-outline" size={18} color={isDark ? '#CBD5E1' : colors.text} />
            <Text style={[styles.popoverItemText, { color: isDark ? '#CBD5E1' : colors.text }]}>Pengaturan Profil</Text>
          </TouchableOpacity>

          <View style={[styles.popoverDivider, { backgroundColor: borderCol }]} />

          <TouchableOpacity
            style={styles.popoverItem}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={18} color="#EF4444" />
            <Text style={[styles.popoverItemText, { color: '#EF4444' }]}>Keluar Akun</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Footer User Card & Theme Toggle */}
      <View style={[styles.footer, { borderTopColor: borderCol }]}>
        <TouchableOpacity
          style={styles.userFooterCard}
          onPress={() => setShowUserMenu(!showUserMenu)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrapperSmall}>
            {profile?.avatar_url ? (
              <SafeImage
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImgSmall}
                fallbackSize={16}
              />
            ) : (
              <View style={[styles.avatarFallbackSmall, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitialSmall}>{userDisplayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.userFooterInfo}>
            <Text numberOfLines={1} style={[styles.userFooterName, { color: isDark ? '#FFFFFF' : colors.text }]}>
              {userDisplayName}
            </Text>
            <Text numberOfLines={1} style={[styles.userFooterEmail, { color: isDark ? '#64748B' : colors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>

          <MaterialIcons name="more-vert" size={18} color={isDark ? '#94A3B8' : colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.themeToggleRow}>
          <ThemeToggle size={24} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100vh' as any,
    borderRightWidth: 1,
    flexShrink: 0,
    position: 'sticky' as any,
    top: 0,
    display: 'flex' as any,
    flexDirection: 'column',
    zIndex: 50,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 20,
  },
  panelSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  workspaceSection: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
  },
  workspaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  workspaceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  workspaceName: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    display: 'flex' as any,
    flexDirection: 'column',
  },
  sectionBlock: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingLeft: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 2,
    transitionDuration: '150ms' as any,
    transitionProperty: 'background-color, color' as any,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  menuLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    flex: 1,
  },
  badgeContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userFooterCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 6,
    borderRadius: 8,
  },
  avatarWrapperSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImgSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallbackSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialSmall: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  userFooterInfo: {
    flex: 1,
  },
  userFooterName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  userFooterEmail: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
  },
  themeToggleRow: {
    paddingLeft: 4,
  },
  userMenuPopover: {
    position: 'absolute' as any,
    bottom: 64,
    left: 12,
    right: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  popoverItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  popoverDivider: {
    height: 1,
    marginVertical: 4,
  },
});

