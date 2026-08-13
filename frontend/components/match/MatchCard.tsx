import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '../common/Button';
import Card from '../common/Card';
import { spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface MatchCardProps {
  title: string;
  venue: string;
  time: string;
  players: string;
  level: string;
  onJoin?: () => void;
}

export default function MatchCard({ title, venue, time, players, level, onJoin }: MatchCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.level, { color: colors.primary }]}>{level}</Text>
        </View>
        <Button title="Join" icon="group-add" onPress={onJoin} style={styles.joinBtn} />
      </View>
      <View style={styles.metaRow}>
        <MaterialIcons name="place" size={16} color={colors.textTertiary} />
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{venue}</Text>
      </View>
      <View style={styles.metaRow}>
        <MaterialIcons name="schedule" size={16} color={colors.textTertiary} />
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{time}</Text>
      </View>
      <View style={styles.metaRow}>
        <MaterialIcons name="groups" size={16} color={colors.textTertiary} />
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{players}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.titleLg,
  },
  level: {
    ...typography.labelMd,
    marginTop: 2,
  },
  joinBtn: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    ...typography.bodyMd,
  },
});
