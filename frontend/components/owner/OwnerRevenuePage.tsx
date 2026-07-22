import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../goalTheme';
import DashboardHeader from '../shared/DashboardHeader';

export default function OwnerRevenuePage() {
  return (
    <View style={st.screen}>
      <DashboardHeader
        title="Pendapatan"
        subtitle="Ringkasan keuangan lapangan Anda"
      />
      <View style={st.body}>
        <View style={st.card}>
          <View style={st.iconWrap}>
            <MaterialIcons name="bar-chart" size={44} color={COLORS.primary} />
          </View>
          <Text style={st.title}>Segera Hadir</Text>
          <Text style={st.desc}>
            Fitur laporan pendapatan sedang dalam pengembangan.
            {'\n'}Pantau terus update terbaru!
          </Text>
          <View style={st.featureList}>
            {[
              'Rekap pendapatan harian & bulanan',
              'Grafik booking per lapangan',
              'Export laporan ke PDF',
            ].map((item) => (
              <View key={item} style={st.featureRow}>
                <View style={st.featureDot} />
                <Text style={st.featureText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadiusXl,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    ...SHADOWS.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary + '25',
  },
  title: { ...FONTS.headlineMd, color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  desc: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  featureText: { ...FONTS.bodyMd, color: COLORS.text },
});
