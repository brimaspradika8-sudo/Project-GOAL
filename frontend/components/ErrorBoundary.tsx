import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS, SHADOWS, SIZES } from './goalTheme';
import { useTheme, ThemeColors } from '../lib/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends React.Component<Props & { colors: ThemeColors }, State> {
  constructor(props: Props & { colors: ThemeColors }) {
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
    const { colors } = this.props;
    if (this.state.hasError) {
      return (
        <View style={[st.container, { backgroundColor: colors.background }]}>
          <View style={st.iconWrap}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
          </View>
          <Text style={[st.title, { color: colors.text }]}>Terjadi Kesalahan</Text>
          <Text style={[st.desc, { color: colors.textSecondary }]}>Aplikasi mengalami error yang tidak terduga.</Text>
          <Text style={[st.errorText, { color: colors.error, backgroundColor: '#fef2f2' }]} numberOfLines={4}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            style={[st.btn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
            <Text style={st.btnText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  const { colors } = useTheme();
  return <ErrorBoundaryClass colors={colors}>{children}</ErrorBoundaryClass>;
}

const st = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: 'center',
  },
  desc: {
    ...FONTS.bodyMd,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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