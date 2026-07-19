import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../store/profileStore';

export default function AdminScreen() {
  const profile = useProfileStore((s) => s.profile);
  const displayName = profile?.full_name || profile?.username || 'Admin';

  return (
    <View style={styles.container}>
      <MaterialIcons name="arrow-back" size={32} color="#4be277" />
      <Text style={styles.text}>Admin panel dipindahkan.{'\n'}{displayName}, silakan pergi ke Admin Panel dengan meng-click link di samping atau kembali.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { color: '#999', fontSize: 15, textAlign: 'center', marginTop: 16, lineHeight: 22 },
});
