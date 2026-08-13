import { Platform } from 'react-native';

const nativeShadows = {
  none: {},
  xs: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
  primary: { shadowColor: '#22C55E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 },
};

const webShadows = {
  none: {},
  xs: { boxShadow: '0px 1px 2px rgba(15,23,42,0.06)' },
  sm: { boxShadow: '0px 1px 3px rgba(15,23,42,0.08)' },
  md: { boxShadow: '0px 8px 24px rgba(15,23,42,0.08)' },
  lg: { boxShadow: '0px 16px 36px rgba(15,23,42,0.12)' },
  xl: { boxShadow: '0px 24px 48px rgba(15,23,42,0.14)' },
  primary: { boxShadow: '0px 10px 26px rgba(34,197,94,0.24)' },
};

export const shadows = Platform.OS === 'web' ? webShadows : nativeShadows;
