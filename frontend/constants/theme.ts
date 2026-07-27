import { Platform } from 'react-native';

const tintColorLight = '#2E7D32';
const tintColorDark = '#66BB6A';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#2E7D32',
    primaryLight: '#E8F5E9',
    card: '#FFFFFF',
    border: '#E0E0E0',
    borderFocus: '#2E7D32',
    placeholder: '#9E9E9E',
    shadow: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#66BB6A',
    primaryLight: '#1B3A24',
    card: '#1E2421',
    border: '#36423A',
    borderFocus: '#66BB6A',
    placeholder: '#A7B0AA',
    shadow: 'rgba(0,0,0,0.32)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
