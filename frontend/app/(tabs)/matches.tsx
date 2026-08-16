import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { radius, shadows, spacing, typography } from '../../components/theme';
import { useTheme } from '../../lib/theme';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const REPORT_FEATURES: { icon: MaterialIconName; title: string; desc: string }[] = [
  {
    icon: 'groups',
    title: 'Riwayat Pertandingan',
    desc: 'Lihat laporan pertandingan yang pernah kamu ikuti atau buat.',
  },
  {
    icon: 'assessment',
    title: 'Statistik & Hasil',
    desc: 'Hasil akhir, skor, dan ringkasan jalannya pertandingan.',
  },
  {
    icon: 'emoji-events',
    title: 'Peringkat Pemain',
    desc: 'Performa dan peringkat pemain komunitas GOAL.',
  },
];

export default function MatchesScreen() {
  const { colors, resolved } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="assessment" size={30} color={colors.primary} />
            </View>
            <Text style={styles.kicker}>Laporan Pertandingan</Text>
            <Text style={styles.title}>Segera hadir</Text>
            <Text style={styles.subtitle}>
              Fitur laporan pertandingan sedang dalam pengembangan. Nantikan statistik, hasil, dan
              ringkasan pertandingan komunitas GOAL di halaman ini.
            </Text>
          </View>

          <View style={styles.features}>
            {REPORT_FEATURES.map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={item.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingTop: Platform.OS === 'ios' ? 58 : 36,
      paddingBottom: 90,
      paddingHorizontal: spacing.gutter,
    },
    shell: {
      width: '100%',
      maxWidth: 860,
      alignSelf: 'center',
    },
    hero: {
      backgroundColor: colors.surfaceWhite,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.divider,
      padding: spacing.xl,
      gap: spacing.sm,
      marginBottom: spacing.lg,
      ...shadows.md,
    },
    heroIcon: {
      width: 58,
      height: 58,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    kicker: {
      ...typography.labelMd,
      color: colors.primary,
    },
    title: {
      ...typography.headlineLg,
      color: colors.text,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    features: {
      gap: spacing.md,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surfaceWhite,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
      padding: spacing.lg,
    },
    featureIcon: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureCopy: {
      flex: 1,
      gap: 2,
    },
    featureTitle: {
      ...typography.headlineSm,
      color: colors.text,
    },
    featureDesc: {
      ...typography.bodySm,
      color: colors.textSecondary,
    },
  });
