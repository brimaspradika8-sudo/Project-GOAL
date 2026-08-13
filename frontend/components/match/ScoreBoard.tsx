import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import { spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface ScoreBoardProps {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  status?: string;
}

export default function ScoreBoard({ homeName, awayName, homeScore, awayScore, status = 'Live Match' }: ScoreBoardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <Text style={[styles.status, { color: colors.primary }]}>{status}</Text>
      <View style={styles.scoreRow}>
        <View style={styles.team}>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>{homeName}</Text>
          <Text style={[styles.score, { color: colors.text }]}>{homeScore}</Text>
        </View>
        <Text style={[styles.divider, { color: colors.textTertiary }]}>:</Text>
        <View style={styles.team}>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>{awayName}</Text>
          <Text style={[styles.score, { color: colors.text }]}>{awayScore}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  status: {
    ...typography.labelMd,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamName: {
    ...typography.labelMd,
  },
  score: {
    ...typography.headlineLg,
  },
  divider: {
    ...typography.headlineMd,
  },
});
