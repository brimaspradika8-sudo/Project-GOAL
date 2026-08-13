export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  primary: '#22C55E',
  secondary: '#16A34A',
  primaryContainer: 'rgba(34,197,94,0.12)',
  border: '#E2E8F0',
  surfaceMuted: '#F1F5F9',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#2563EB',
};

export const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  primary: '#22C55E',
  secondary: '#4ADE80',
  primaryContainer: 'rgba(34,197,94,0.16)',
  border: '#334155',
  surfaceMuted: '#111827',
  success: '#22C55E',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
};

export type GoalMode = 'light' | 'dark';
export type GoalBaseColors = typeof lightColors;
