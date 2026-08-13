import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Card from '../common/Card';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../../lib/theme';

interface PlayerCardProps {
  name: string;
  position?: string;
  level?: string;
  avatarUrl?: string | null;
}

export default function PlayerCard({ name, position = 'Player', level = 'Open', avatarUrl }: PlayerCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="person" size={22} color={colors.primary} />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{position}</Text>
      </View>
      <View style={[styles.levelBadge, { backgroundColor: colors.primaryContainer }]}>
        <Text style={[styles.level, { color: colors.primary }]}>{level}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  name: {
    ...typography.titleMd,
  },
  meta: {
    ...typography.bodySm,
    marginTop: 2,
  },
  levelBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  level: {
    ...typography.labelSm,
  },
});
