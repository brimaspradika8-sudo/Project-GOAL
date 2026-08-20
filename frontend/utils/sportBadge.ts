import { MaterialIcons } from '@expo/vector-icons';

export interface SportBadgeStyle {
  bg: string;
  color: string;
  border: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

export function getSportBadgeStyle(sportType?: string | null): SportBadgeStyle {
  const type = (sportType || '').toLowerCase();

  if (type.includes('futsal') || type.includes('sepak') || type.includes('soccer')) {
    return {
      bg: '#E6F4EA',
      color: '#137333',
      border: '#CEEAD6',
      icon: 'sports-soccer',
    };
  }

  if (type.includes('basket')) {
    return {
      bg: '#FFF0E6',
      color: '#D97706',
      border: '#FDE68A',
      icon: 'sports-basketball',
    };
  }

  if (type.includes('badminton') || type.includes('bulutangkis')) {
    return {
      bg: '#F3E8FD',
      color: '#7E10E0',
      border: '#E9D5FF',
      icon: 'sports-tennis',
    };
  }

  if (type.includes('tenis') || type.includes('tennis') || type.includes('padel')) {
    return {
      bg: '#E0F7FA',
      color: '#00796B',
      border: '#B2EBF2',
      icon: 'sports-tennis',
    };
  }

  if (type.includes('volli') || type.includes('volley')) {
    return {
      bg: '#FEF3C7',
      color: '#B45309',
      border: '#FDE68A',
      icon: 'sports-volleyball',
    };
  }

  return {
    bg: '#E8F0FE',
    color: '#1A73E8',
    border: '#D2E3FC',
    icon: 'sports',
  };
}
