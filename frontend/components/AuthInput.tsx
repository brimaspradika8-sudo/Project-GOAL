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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from './goalTheme';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  error?: string;
  rightElement?: React.ReactNode;
}

const AuthInput = React.forwardRef<TextInput, AuthInputProps>(
  ({ label, icon, isPassword = false, containerStyle, error, value, rightElement, ...props }, ref) => {
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
    const handleBlur = () => setIsFocused(false);
    const toggleSecure = () => setIsSecure(v => !v);

    const hasError = !!error;
    const isActive = isFocused || !!value;

    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [hasError ? COLORS.error : COLORS.outlineVariant, hasError ? COLORS.error : COLORS.primary],
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
      outputRange: [hasError ? COLORS.error : COLORS.textSecondary, hasError ? COLORS.error : COLORS.primary],
    });

    return (
      <View style={containerStyle}>
        <Animated.View style={[styles.container, { borderColor, backgroundColor: isFocused || hasError ? COLORS.surfaceWhite : COLORS.surfaceAlt }]}>
          {icon && (
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={icon}
                size={24}
                color={isActive || hasError ? (hasError ? COLORS.error : COLORS.primary) : COLORS.textTertiary}
              />
            </View>
          )}
          <Animated.View style={[
            styles.labelContainer,
            {
              transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
              left: icon ? 52 : 18,
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
              },
            ]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isSecure}
            placeholderTextColor={COLORS.textTertiary}
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
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
          )}
          {!isPassword && rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </Animated.View>
        {hasError && <Text style={styles.errorText}>{error}</Text>}
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
    backgroundColor: COLORS.surfaceWhite,
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
    backgroundColor: COLORS.surfaceWhite,
  },
  label: {
    ...FONTS.bodyMd,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
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
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 16,
  },
});

export default AuthInput;
