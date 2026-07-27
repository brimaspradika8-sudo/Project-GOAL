import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../goalTheme';

export interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  title: string;
  accentColor: string;
  items: SidebarItem[];
}

interface SidebarMenuItemProps {
  item: SidebarItem;
  active: boolean;
  activeColor: string;
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
  inactiveColor,
  onPress,
}: SidebarMenuItemProps) {
  const itemColor = active ? activeColor : inactiveColor;

  return (
    <Pressable
      key={item.href}
      style={[
        styles.menuItem,
        active && styles.menuItemActive,
      ]}
      onPress={onPress}
    >
      <MaterialIcons
        name={item.icon as any}
        size={20}
        color={itemColor}
      />
      <Text
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
    </Pressable>
  );
}

export default function Sidebar({ title, accentColor, items }: SidebarProps) {
  const { colors, resolved } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  if (Platform.OS !== 'web') return null;

  const activeColor = accentColor;
  const inactiveColor = resolved === 'dark' ? '#94A3B8' : '#4B5563';
  const panelTitleColor = resolved === 'dark' ? '#CBD5E1' : colors.text;

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderRightColor: colors.outline,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>GOAL</Text>
        <Text style={[styles.title, { color: panelTitleColor }]}>{title}</Text>
      </View>

      <View style={styles.menu}>
        {items.map((item) => {
          const active = isSidebarRouteActive(pathname, item.href);
          return (
            <SidebarMenuItem
              key={item.href}
              item={item}
              active={active}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              onPress={() => router.push(item.href as any)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 256,
    height: '100vh' as any,
    borderRightWidth: 1,
    flexShrink: 0,
    position: 'sticky' as any,
    top: 0,
    display: 'flex' as any,
    flexDirection: 'column',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
  },
  logo: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  menu: {
    flex: 1,
    padding: 12,
    display: 'flex' as any,
    flexDirection: 'column',
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
    transitionDuration: '180ms' as any,
    transitionProperty: 'background-color, color' as any,
    transitionTimingFunction: 'ease' as any,
  },
  menuItemActive: {
    backgroundColor: '#EDE7FF',
  },
  menuLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    transitionDuration: '180ms' as any,
    transitionProperty: 'color, font-weight' as any,
    transitionTimingFunction: 'ease' as any,
  },
});
