import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../components/goalTheme';
import { FadeInView } from '../../components/FadeInView';

export default function MatchesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageShell}>
        <FadeInView>
          <Text style={styles.title}>Pertandingan</Text>
          <Text style={styles.subtitle}>Kelola jadwal dan lihat undangan dalam satu tempat.</Text>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={[styles.actionRow, isDesktop && styles.actionRowDesktop]}>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="add-circle" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Buat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="search" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Cari</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
              <View style={styles.actionIconWrap}>
                <MaterialIcons name="group-add" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Undang</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <View style={[styles.emptyCard, isDesktop && styles.emptyCardDesktop]}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="event-busy" size={36} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Belum ada pertandingan aktif</Text>
            <Text style={styles.emptyDesc}>Buat atau cari pertandingan untuk mulai bermain.</Text>
          </View>
        </FadeInView>

        <FadeInView delay={300}>
          <Text style={styles.sectionTitle}>RIWAYAT</Text>
          <View style={[styles.emptyCard, isDesktop && styles.emptyCardDesktop]}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="history" size={36} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Riwayat kosong</Text>
            <Text style={styles.emptyDesc}>Pertandingan selesai akan muncul di sini.</Text>
          </View>
        </FadeInView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageShell: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  title: {
    ...FONTS.headlineLg,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    marginBottom: 22,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionRowDesktop: {
    gap: 16,
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 100,
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...FONTS.titleMd,
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: SIZES.borderRadiusLg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 28,
    alignItems: 'center',
    ...SHADOWS.sm,
    marginBottom: 20,
  },
  emptyCardDesktop: {
    paddingVertical: 36,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    ...FONTS.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
});
