import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: FloatingInputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: (isFocused || value !== '') ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedIsFocused, isFocused, value]);

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9CA3AF', '#10B981'],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['transparent', 'transparent', '#2D3748'],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
    zIndex: 2,
    borderRadius: 4,
  };

  return (
    <View style={styles.inputContainer}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: '#2D3748',
            borderColor: isFocused ? '#10B981' : 'rgba(255,255,255,0.1)',
            borderWidth: isFocused ? 1.5 : 1,
            color: '#F9FAFB',
          },
          isFocused && focusRing('#10B981'),
          Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {},
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <MaterialIcons
            name={isPasswordVisible ? 'visibility' : 'visibility-off'}
            size={22}
            color={isFocused ? '#10B981' : '#6B7280'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 24,
    position: 'relative',
    height: 60,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    fontSize: 16,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 19,
    position: 'absolute',
    right: 16,
    top: 19,
    zIndex: 3,
  },
});

function focusRing(color: string) {
  return Platform.OS === 'web'
    ? ({ outlineStyle: 'none' } as any)
    : { shadowColor: color, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 0 };
}
