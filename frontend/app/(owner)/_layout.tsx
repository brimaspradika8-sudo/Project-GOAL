import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import Sidebar, { SidebarItem } from '../../components/web/Sidebar';

export default function OwnerTabLayout() {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  const sidebarItems: SidebarItem[] = [
    { href: '/(owner)/fields', label: 'Kelola Lapangan', icon: 'stadium' },
    { href: '/(owner)/bookings', label: 'Kelola Booking', icon: 'receipt-long' },
    { href: '/(owner)/revenue', label: 'Kelola Pendapatan', icon: 'bar-chart' },
    { href: '/(owner)/profile', label: 'Profile', icon: 'person' },
  ];

  if (isWeb) {
    return (
      <View style={styles.webRoot}>
        <Sidebar
          title="Owner Panel"
          accentColor={colors.accentOrange}
          items={sidebarItems}
        />
        <View style={styles.webContent}>
          <Tabs
            tabBar={() => null}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textTertiary,
              tabBarLabelStyle: styles.tabLabel,
              tabBarItemStyle: styles.tabItem,
            }}
          >
            <Tabs.Screen
              name="fields"
              options={{
                title: 'Lapangan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="stadium" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="bookings"
              options={{
                title: 'Booking',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="receipt-long" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="revenue"
              options={{
                title: 'Pendapatan',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="bar-chart" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profil',
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person" size={24} color={color} />
                ),
              }}
              listeners={{ tabPress: () => Haptics.selectionAsync() }}
            />
            <Tabs.Screen name="index" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.outline }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="fields"
        options={{
          title: 'Lapangan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="stadium" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="receipt-long" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Pendapatan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bar-chart" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    flexDirection: 'row',
    height: '100%' as any,
  },
  webContent: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabItem: { paddingVertical: 4 },
});
