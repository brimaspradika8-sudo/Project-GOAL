import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from './goalTheme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.title}>Terjadi Kesalahan</Text>
          <Text style={styles.desc}>Aplikasi mengalami error yang tidak terduga.</Text>
          <Text style={styles.errorText} numberOfLines={4}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.btnText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    ...FONTS.headlineLg,
    color: COLORS.text,
    textAlign: 'center',
  },
  desc: {
    ...FONTS.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.error,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 12,
    ...SHADOWS.primary,
  },
  btnText: {
    color: '#ffffff',
    ...FONTS.buttonLg,
  },
});
