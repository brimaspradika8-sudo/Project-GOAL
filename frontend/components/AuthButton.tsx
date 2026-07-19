import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, FONTS, SHADOWS } from './goalTheme';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ title, loading = false, disabled, style, ...props }) => {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.onPrimary} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.onPrimary,
    ...FONTS.buttonLg,
    fontWeight: '700',
  },
});

export default AuthButton;
