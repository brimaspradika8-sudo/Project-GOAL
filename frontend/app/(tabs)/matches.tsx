import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, EmptyState, Input } from '../../components/common';
import { MatchCard } from '../../components/match';
import { radius, shadows, spacing, typography } from '../../components/theme';
import { useTheme } from '../../lib/theme';
import { useMatchStore, type CreateMatchPayload } from '../../store/matchStore';
import { useToastStore } from '../../store/toastStore';

const initialForm: CreateMatchPayload = {
  title: '',
  sport: 'Futsal',
  venue: '',
  date: '',
  time: '',
  maxPlayers: 10,
  level: 'Open',
};

export default function MatchesScreen() {
  const { colors, resolved } = useTheme();
  const { matches, loading, fetchMatches, joinMatch, createMatch } = useMatchStore();
  const showToast = useToastStore((state) => state.show);
  const [refreshing, setRefreshing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [form, setForm] = useState<CreateMatchPayload>(initialForm);
  const styles = makeStyles(colors);

  useEffect(() => {
    fetchMatches().catch(() => {});
  }, [fetchMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMatches();
    } finally {
      setRefreshing(false);
    }
  }, [fetchMatches]);

  const submit = useCallback(async () => {
    if (!form.title.trim() || !form.venue.trim()) {
      showToast({ type: 'error', title: 'Data belum lengkap', description: 'Isi judul dan venue match terlebih dahulu.' });
      return;
    }
    await createMatch(form);
    setCreateVisible(false);
    setForm(initialForm);
    showToast({ type: 'success', title: 'Match dibuat', description: 'Pemain lain sudah bisa melihat match kamu.' });
  }, [createMatch, form, showToast]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.shell}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="groups" size={30} color={colors.primary} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.kicker}>Community Match</Text>
                <Text style={styles.title}>Cari lawan sparring dan tim tambahan</Text>
                <Text style={styles.subtitle}>Buat match, atur level, lalu kumpulkan pemain dari komunitas GOAL.</Text>
              </View>
              <Button title="Create" icon="add" onPress={() => setCreateVisible(true)} style={styles.heroButton} />
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{matches.length}</Text>
                <Text style={styles.summaryLabel}>Open Match</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{matches.reduce((acc, item) => acc + item.players, 0)}</Text>
                <Text style={styles.summaryLabel}>Players</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Match tersedia</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.shell}>
            <MatchCard
              title={item.title}
              venue={item.venue}
              time={`${item.date} • ${item.time}`}
              players={`${item.players}/${item.maxPlayers} pemain`}
              level={item.level}
              onJoin={async () => {
                await joinMatch(item.id);
                showToast({ type: 'success', title: 'Berhasil join', description: `Kamu masuk ke ${item.title}.` });
              }}
            />
          </View>
        )}
        ListEmptyComponent={!loading ? <EmptyState title="Belum ada match" description="Jadilah yang pertama membuat jadwal sparring." /> : null}
        ListFooterComponent={<View style={{ height: 90 }} />}
      />

      <Modal visible={createVisible} transparent animationType="fade" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Match</Text>
            <Input label="Title" icon="sports-soccer" placeholder="Futsal Friendly 5v5" value={form.title} onChangeText={(title) => setForm((prev) => ({ ...prev, title }))} />
            <Input label="Venue" icon="place" placeholder="GOAL Arena Kemang" value={form.venue} onChangeText={(venue) => setForm((prev) => ({ ...prev, venue }))} />
            <View style={styles.inlineInputs}>
              <Input label="Date" placeholder="2026-08-20" value={form.date} onChangeText={(date) => setForm((prev) => ({ ...prev, date }))} style={styles.inlineInput} />
              <Input label="Time" placeholder="19:00" value={form.time} onChangeText={(time) => setForm((prev) => ({ ...prev, time }))} style={styles.inlineInput} />
            </View>
            <View style={styles.levelRow}>
              {(['Open', 'Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.levelChip, form.level === level && styles.levelChipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, level }))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.levelText, form.level === level && styles.levelTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Button title="Batal" variant="ghost" onPress={() => setCreateVisible(false)} style={styles.actionButton} />
              <Button title="Buat Match" icon="check" onPress={submit} style={styles.actionButton} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
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
    gap: spacing.lg,
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
  },
  heroCopy: {
    gap: spacing.xs,
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
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.section,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
  },
  summaryValue: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  summaryLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceWhite,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 38 : spacing.xl,
    gap: spacing.md,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.divider,
    alignSelf: 'center',
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.text,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inlineInput: {
    minWidth: 0,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  levelChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  levelChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary + '55',
  },
  levelText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  levelTextActive: {
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
