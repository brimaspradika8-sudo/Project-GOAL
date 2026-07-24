import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { FONT_FAMILY } from '../../components/goalTheme';
import TopNavbar from '../../components/web/TopNavbar';

const isWeb = Platform.OS === 'web';

export default function TabLayout() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={isWeb ? styles.webContainer : undefined}>
      {isWeb && <TopNavbar />}
      <Tabs
        tabBar={isWeb ? () => null : undefined}
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => Haptics.selectionAsync(),
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            title: 'Booking',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="event-available" size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => Haptics.selectionAsync(),
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            title: 'Match',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="sports-soccer" size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => Haptics.selectionAsync(),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="person" size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => Haptics.selectionAsync(),
          }}
        />
        <Tabs.Screen
          name="my-fields"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="fields"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="explore"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="admin"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}

import { FONT_FAMILY } from '../../components/goalTheme';

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  webContainer: {
    flex: 1,
    minHeight: '100vh' as any,
  },
  tabBar: {
    backgroundColor: colors.surface,
<<<<<<< HEAD
    borderTopWidth: Platform.OS === 'web' ? 1 : 0,
    borderTopColor: colors.outline,
=======
    borderTopWidth: 0,
>>>>>>> 4ea81c7 (memeprbaiki ux)
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      maxWidth: 640,
      width: '100%' as any,
      marginHorizontal: 'auto' as any,
      alignSelf: 'center' as any,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.outline,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    } : {}),
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
