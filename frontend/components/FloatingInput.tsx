import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Animated, Easing, Platform, Text, TextInputProps } from 'react-native';
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
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  inputMode?: TextInputProps['inputMode'];
  error?: string;
  onBlur?: () => void;
  colors?: ThemeColors;
  icon?: ReactNode;
  compact?: boolean;
}

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  inputMode,
  error,
  onBlur,
  colors: colorsOverride,
  icon,
  compact = false,
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
    left: icon ? 52 : 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [compact ? 14 : 18, compact ? -8 : -10],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [compact ? 14 : 16, compact ? 11 : 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, hasError ? colors.error : colors.primary],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['transparent', 'transparent', isDark ? colors.surfaceWhite : '#FFFFFF'],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
    zIndex: 2,
    borderRadius: 4,
  };

  return (
    <View style={[styles.inputContainer, compact && styles.compactInputContainer]}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? 'rgba(40,40,40,0.8)' : '#FFFFFF',
              borderColor: hasError ? '#DC2626' : (isFocused ? '#1FCB8B' : (isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB')),
              color: isDark ? '#E5E7EB' : '#4B5563',
              paddingLeft: icon ? (compact ? 48 : 52) : 16,
              paddingRight: secureTextEntry ? (compact ? 44 : 48) : 16,
              height: compact ? 52 : 60,
            },
            isFocused && focusRing('#1FCB8B'),
            Platform.OS === 'web' && secureTextEntry ? { appearance: 'none' as any } : {},
            Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {},
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); onBlur?.(); }}
          onChangeText={onChangeText}
          value={value}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          inputMode={inputMode}
          placeholderTextColor="#9CA3AF"
        />
        {icon ? <View style={[styles.iconContainer, compact && styles.compactIconContainer]}>{icon}</View> : null}
        {secureTextEntry && (
          <TouchableOpacity
            style={[styles.eyeIcon, compact && styles.compactEyeIcon]}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            activeOpacity={0.6}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityState={{ checked: isPasswordVisible }}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility' : 'visibility-off'}
              size={22}
              color={isFocused ? '#1FCB8B' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}
      </View>
      {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 28,
    position: 'relative',
    minHeight: 60,
  },
  compactInputContainer: {
    marginBottom: 18,
  },
  compactIconContainer: {
    height: 52,
  },
  inputWrapper: {
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 2,
  },
  iconContainer: {
    position: 'absolute',
    left: 8,
    top: 0,
    zIndex: 2,
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    fontSize: 16,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  compactEyeIcon: {
    top: 4,
  },
  errorText: {
    ...FONTS.bodySm,
    color: '#DC2626',
    marginTop: 6,
    marginLeft: 4,
    marginBottom: 2,
  },
});

function focusRing(color: string) {
  return Platform.OS === 'web'
    ? ({ boxShadow: `0 0 0 3px rgba(31, 203, 139, 0.2)`, outlineStyle: 'none' } as any)
    : { shadowColor: color, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 0 };
}
