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

export default function Sidebar({ title, accentColor, items }: SidebarProps) {
  const { colors, resolved } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  if (Platform.OS !== 'web') return null;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const activeBackground = resolved === 'dark' ? '#1E293B' : accentColor + '1A';
  const activeColor = resolved === 'dark' ? '#FFFFFF' : accentColor;
  const inactiveColor = resolved === 'dark' ? '#94A3B8' : colors.textSecondary;
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
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              style={[
                styles.menuItem,
                active && { backgroundColor: activeBackground },
              ]}
              onPress={() => router.push(item.href as any)}
            >
              <MaterialIcons
                name={item.icon as any}
                size={20}
                color={active ? activeColor : inactiveColor}
              />
              <Text
                style={[
                  styles.menuLabel,
                  { color: active ? activeColor : inactiveColor },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
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
  },
  menuLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
});
