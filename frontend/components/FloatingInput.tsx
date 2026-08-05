import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Animated, Easing, Platform, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../lib/theme';
import { FONTS } from './goalTheme';

interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  onBlur?: () => void;
  colors?: ThemeColors;
}

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  onBlur,
  colors: colorsOverride,
}: FloatingInputProps) {
  const { colors: themeColors, resolved } = useTheme();
  const colors = colorsOverride ?? themeColors;
  const isDark = resolved === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;
  const hasError = !!error;

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
      outputRange: [colors.textSecondary, hasError ? '#DC2626' : '#1FCB8B'],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['transparent', 'transparent', isDark ? '#1e1e1e' : '#FFFFFF'],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
    zIndex: 2,
    borderRadius: 4,
  };

  return (
    <View style={[styles.inputContainer, hasError && { marginBottom: 6 }]}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? 'rgba(40,40,40,0.8)' : '#FFFFFF',
            borderColor: hasError ? '#DC2626' : (isFocused ? '#1FCB8B' : (isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB')),
            color: isDark ? '#E5E7EB' : '#4B5563',
          },
          isFocused && focusRing('#1FCB8B'),
          Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {},
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); onBlur?.(); }}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#9CA3AF"
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          activeOpacity={0.6}
        >
          <MaterialIcons
            name={isPasswordVisible ? 'visibility' : 'visibility-off'}
            size={22}
            color={isFocused ? '#1FCB8B' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}
      {hasError && <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>}
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
    borderWidth: 1.5,
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    fontSize: 16,
    zIndex: 1,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease' as any,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 19,
    zIndex: 3,
  },
  errorText: {
    ...FONTS.bodySm,
    marginTop: 4,
    marginLeft: 4,
  },
});

function focusRing(color: string) {
  return Platform.OS === 'web'
    ? ({ boxShadow: `0 0 0 3px rgba(31, 203, 139, 0.2)`, outlineStyle: 'none' } as any)
    : { shadowColor: color, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 0 };
}
