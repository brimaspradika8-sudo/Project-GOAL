import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Text,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from './goalTheme';
import { useTheme } from '../lib/theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  error?: string;
  onBlur?: () => void;
  rightElement?: React.ReactNode;
}

const AuthInput = React.forwardRef<TextInput, AuthInputProps>(
  ({ label, icon, isPassword = false, containerStyle, error, value, rightElement, onBlur: onBlurProp, ...props }, ref) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(isPassword);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: isFocused || !!value ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }, [isFocused, value, animatedValue]);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => { setIsFocused(false); onBlurProp?.(); };
    const toggleSecure = () => setIsSecure(v => !v);

    const hasError = !!error;
    const isActive = isFocused || !!value;

    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [hasError ? colors.destructive : colors.borderSubtle, hasError ? colors.destructive : colors.primary],
    });

    const labelTranslateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -28],
    });

    const labelScale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.85],
    });

    const labelColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [hasError ? colors.destructive : colors.textTertiary, hasError ? colors.destructive : colors.primary],
    });

    return (
      <View style={containerStyle}>
        <Animated.View style={[
          styles.container,
          {
            borderColor,
            backgroundColor: colors.bgElevated,
            ...(isFocused ? focusRing(colors.focusRing) : null),
          },
        ]}>
          {icon && (
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={icon}
                size={24}
                color={isActive || hasError ? (hasError ? colors.destructive : colors.primary) : colors.textTertiary}
              />
            </View>
          )}
          <Animated.View style={[
            styles.labelContainer,
            {
              transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                left: icon ? 52 : 18,
                backgroundColor: isActive ? colors.bgElevated : 'transparent',
              },
            ]}>
            <Animated.Text style={[styles.label, { color: labelColor }]}>{label}</Animated.Text>
          </Animated.View>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                paddingLeft: icon ? 12 : 18,
                paddingRight: isPassword || rightElement ? 44 : 18,
                color: colors.textPrimary,
              },
              Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {},
            ]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isSecure}
            placeholderTextColor={colors.textMuted}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={toggleSecure}
              style={styles.rightElement}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isSecure ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
            >
              <MaterialIcons
                name={isSecure ? 'visibility-off' : 'visibility'}
                size={22}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
          {!isPassword && rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </Animated.View>
        {hasError && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 4,
  },
  label: {
    ...FONTS.bodyMd,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingTop: 10,
  },
  rightElement: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  errorText: {
    ...FONTS.bodySm,
    marginTop: 6,
    marginLeft: 16,
  },
});

function focusRing(color: string) {
  return Platform.OS === 'web'
    ? ({ outlineStyle: 'none' } as any)
    : { shadowColor: color, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 0 };
}

export default AuthInput;
