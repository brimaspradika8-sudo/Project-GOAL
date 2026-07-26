import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../store/profileStore';
import { useTheme } from '../../lib/theme';

export default function AdminScreen() {
  const profile = useProfileStore((s) => s.profile);
  const displayName = profile?.full_name || profile?.username || 'Admin';
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MaterialIcons name="arrow-back" size={32} color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>Admin panel dipindahkan.{'\n'}{displayName}, silakan pergi ke Admin Panel dengan meng-click link di samping atau kembali.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, maxWidth: 440, alignSelf: 'center' },
  text: { fontSize: 15, textAlign: 'center', marginTop: 16, lineHeight: 22 },
});
