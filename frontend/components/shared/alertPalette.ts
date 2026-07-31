import type { ResolvedMode, ThemeColors } from '../../lib/theme';
import { MaterialIcons } from '@expo/vector-icons';

export type AlertType = 'success' | 'info' | 'warning' | 'error';

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

export interface AlertPalette {
  accent: string;
  background: string;
  border: string;
  text: string;
  icon: MaterialIconName;
}

export function getAlertPalette(type: AlertType, colors: ThemeColors, resolved: ResolvedMode): AlertPalette {
  const isDark = resolved === 'dark';

  switch (type) {
    case 'success':
      return {
        accent: colors.success,
        background: colors.successLight,
        border: colors.success,
        text: colors.onPrimaryContainer,
        icon: 'check-circle',
      };
    case 'info':
      return {
        accent: colors.info,
        background: colors.infoLight,
        border: colors.info,
        text: colors.onInfo,
        icon: 'info',
      };
    case 'warning':
      return {
        accent: colors.warning,
        background: colors.warningMuted,
        border: colors.warning,
        text: colors.onWarning,
        icon: 'warning',
      };
    case 'error':
      return {
        accent: colors.error,
        background: isDark ? colors.errorContainer : colors.errorLight,
        border: colors.error,
        text: colors.onErrorContainer,
        icon: 'error',
      };
  }
}
