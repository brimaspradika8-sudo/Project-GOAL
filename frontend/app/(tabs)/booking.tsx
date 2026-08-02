import React from 'react';
import {
  StyleSheet, View, Text, Platform, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../components/goalTheme';
import { FadeInView } from '../../components/FadeInView';
import { useTheme } from '../../lib/theme';

export default function BookingTabScreen() {
  const { colors, resolved } = useTheme();
  const st = makeStyles(colors);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={st.center}>
        <View style={[st.iconWrap, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="confirmation-number" size={40} color={colors.primary} />
        </View>
        <Text style={[st.title, { color: colors.text }]}>Booking</Text>
        <Text style={[st.badge, { color: colors.primary, backgroundColor: colors.primaryContainer }]}>Segera Hadir</Text>
        <Text style={[st.desc, { color: colors.textSecondary }]}>
          Fitur pemesanan lapangan sedang kami kembangkan.{'\n'}
          Nantikan pembaruan berikutnya!
        </Text>
      </FadeInView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 36,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...FONTS.headlineLg,
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  desc: {
    ...FONTS.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
