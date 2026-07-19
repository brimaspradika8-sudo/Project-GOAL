import React from 'react';
import { TextInput, TextInputProps, ViewStyle } from 'react-native';
import AuthInput from './AuthInput';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  icon?: keyof typeof import('@expo/vector-icons')['MaterialIcons']['glyphMap'];
  containerStyle?: ViewStyle;
  error?: string;
}

const PasswordInput = React.forwardRef<TextInput, PasswordInputProps>(
  ({ ...props }, ref) => {
    return <AuthInput ref={ref} {...props} isPassword />;
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
