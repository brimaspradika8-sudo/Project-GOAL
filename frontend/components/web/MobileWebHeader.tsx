import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../goalTheme';
import type { SidebarItem } from './Sidebar';

interface MobileWebHeaderProps {
  title: string;
  accentColor: string;
  items: SidebarItem[];
  activeRoute?: string;
  onNavigate: (href: string) => void;
}

export default function MobileWebHeader({ title, accentColor, items, activeRoute, onNavigate }: MobileWebHeaderProps) {
  const { colors, resolved } = useTheme();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (drawerOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, damping: 20, stiffness: 200 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -280, duration: 200, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    }
  }, [drawerOpen, slideAnim, backdropAnim]);

  const isActive = (href: string) => activeRoute === href || activeRoute?.startsWith(href + '/');

  const activeBg = resolved === 'dark' ? '#1E293B' : accentColor + '1A';
  const activeColor = resolved === 'dark' ? '#FFFFFF' : accentColor;
  const inactiveColor = resolved === 'dark' ? '#94A3B8' : colors.textSecondary;
  const panelTitleColor = resolved === 'dark' ? '#CBD5E1' : colors.text;

  return (
    <>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Pressable style={styles.hamburger} onPress={() => setDrawerOpen(true)} hitSlop={12}>
          <MaterialIcons name="menu" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>GOAL</Text>
        <View style={styles.headerActions}>
          <Text style={[styles.panelLabel, { color: panelTitleColor }]}>{title}</Text>
        </View>
      </View>

      {drawerOpen && (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDrawerOpen(false)} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderRightColor: colors.outline,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.drawerHeader, { borderBottomColor: colors.outline }]}>
          <Text style={[styles.drawerLogo, { color: colors.primary }]}>GOAL</Text>
          <Text style={[styles.drawerTitle, { color: panelTitleColor }]}>{title}</Text>
        </View>
        <View style={styles.drawerMenu}>
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Pressable
                key={item.href}
                style={[styles.drawerItem, active && { backgroundColor: activeBg }]}
                onPress={() => {
                  setDrawerOpen(false);
                  onNavigate(item.href);
                }}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={active ? activeColor : inactiveColor}
                />
                <Text
                  style={[styles.drawerLabel, { color: active ? activeColor : inactiveColor }]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  hamburger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerActions: {
    marginLeft: 'auto',
  },
  panelLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 90,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    height: '100%',
    zIndex: 100,
    borderRightWidth: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    paddingTop: 56,
  },
  drawerLogo: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  drawerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  drawerMenu: {
    flex: 1,
    padding: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 48,
  },
  drawerLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
});
