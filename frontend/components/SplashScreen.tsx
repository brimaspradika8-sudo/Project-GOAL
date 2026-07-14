import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface Props { onFinish: () => void }

export default function SplashScreen({ onFinish }: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.root}>
      <Text style={s.letter}>GOAL</Text>
      <Text style={s.tag}>Game Organizer & Arena League</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 76,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadow: '0px 0px 18px #4be277',
  },
  tag: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginTop: 12,
  },
});
