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
import { FONTS } from './goalTheme';
import { useTheme } from '../lib/theme';

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
    const handleBlur = () => setIsFocused(false);
    const toggleSecure = () => setIsSecure(v => !v);

    const hasError = !!error;
    const isActive = isFocused || !!value;

    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [hasError ? colors.error : colors.outlineVariant, hasError ? colors.error : colors.primary],
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
      outputRange: [hasError ? colors.error : colors.textSecondary, hasError ? colors.error : colors.primary],
    });

    const st = makeStyles(colors);

    return (
      <View style={containerStyle}>
        <Animated.View style={[st.container, { borderColor, backgroundColor: isFocused || hasError ? colors.surfaceWhite : colors.surfaceAlt }]}>
          {icon && (
            <View style={st.iconContainer}>
              <MaterialIcons
                name={icon}
                size={24}
                color={isActive || hasError ? (hasError ? colors.error : colors.primary) : colors.textTertiary}
              />
            </View>
          )}
          <Animated.View style={[
            st.labelContainer,
            {
              transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
              left: icon ? 52 : 18,
            },
          ]}>
            <Animated.Text style={[st.label, { color: labelColor }]}>{label}</Animated.Text>
          </Animated.View>
          <TextInput
            ref={ref}
            style={[
              st.input,
              {
                paddingLeft: icon ? 12 : 18,
                paddingRight: isPassword || rightElement ? 44 : 18,
              },
            ]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isSecure}
            placeholderTextColor={colors.textTertiary}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={toggleSecure}
              style={st.rightElement}
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
          {!isPassword && rightElement && <View style={st.rightElement}>{rightElement}</View>}
        </Animated.View>
        {hasError && <Text style={st.errorText}>{error}</Text>}
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceWhite,
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
    backgroundColor: colors.surfaceWhite,
  },
  label: {
    ...FONTS.bodyMd,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
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
    color: colors.error,
    marginTop: 6,
    marginLeft: 16,
  },
});

export default AuthInput;
