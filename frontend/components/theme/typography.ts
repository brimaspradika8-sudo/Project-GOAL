import { Platform } from 'react-native';

export const fontFamily = Platform.OS === 'web'
  ? '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  : 'System';

export const typography = {
  display: { fontFamily, fontSize: 32, fontWeight: '800' as const, lineHeight: 38 },
  headlineLg: { fontFamily, fontSize: 28, fontWeight: '800' as const, lineHeight: 34 },
  headlineMd: { fontFamily, fontSize: 22, fontWeight: '800' as const, lineHeight: 28 },
  headlineSm: { fontFamily, fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  titleLg: { fontFamily, fontSize: 16, fontWeight: '700' as const, lineHeight: 22 },
  titleMd: { fontFamily, fontSize: 14, fontWeight: '700' as const, lineHeight: 20 },
  bodyLg: { fontFamily, fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontFamily, fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontFamily, fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  labelLg: { fontFamily, fontSize: 14, fontWeight: '700' as const, lineHeight: 18 },
  labelMd: { fontFamily, fontSize: 12, fontWeight: '700' as const, lineHeight: 16 },
  labelSm: { fontFamily, fontSize: 10, fontWeight: '800' as const, lineHeight: 14 },
  buttonLg: { fontFamily, fontSize: 16, fontWeight: '800' as const, lineHeight: 20 },
  buttonMd: { fontFamily, fontSize: 14, fontWeight: '800' as const, lineHeight: 18 },
};
