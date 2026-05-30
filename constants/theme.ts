import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ThemeColors {
  bg: string;
  bgDeep: string;
  accent: string;
  accentLight: string;
  success: string;
  successLight: string;
  warning: string;
  danger: string;
  white: string;
  black: string;
  text: string;
  textMuted: string;
  textDim: string;
  cardBorder: string;
  cardBg: string;
  navBg: string;
  navBorder: string;
  headerBtnBg: string;
  headerBtnBorder: string;
  isDark: boolean;
}

export const DARK_COLORS: ThemeColors = {
  bg: '#060a14',
  bgDeep: '#1a2540',
  accent: '#051650',
  accentLight: '#0d2060',
  success: '#2ecc71',
  successLight: '#5ddb8f',
  warning: '#f59e0b',
  danger: '#ef4444',

  white: '#ffffff',
  black: '#000000',
  text: '#e2e8f5',
  textMuted: '#c8d8f0',
  textDim: '#4a6080',

  cardBorder: 'rgba(255,255,255,0.08)',
  cardBg: '#111d35',

  navBg: 'rgba(13,21,38,0.85)',
  navBorder: 'rgba(255,255,255,0.10)',

  headerBtnBg: 'rgba(255,255,255,0.08)',
  headerBtnBorder: 'rgba(255,255,255,0.10)',
  isDark: true,
};

export const LIGHT_COLORS: ThemeColors = {
  bg: '#eef1f8',
  bgDeep: '#ffffff',
  accent: '#051650',
  accentLight: '#0d2060',
  success: '#2ecc71',
  successLight: '#5ddb8f',
  warning: '#f59e0b',
  danger: '#ef4444',

  white: '#ffffff',
  black: '#000000',
  text: '#051650',
  textMuted: '#8a94a6',
  textDim: 'rgba(5,22,80,0.35)',

  cardBorder: '#dde1ea',
  cardBg: '#f4f6fb',

  navBg: 'rgba(255,255,255,0.55)',
  navBorder: 'rgba(255,255,255,0.6)',

  headerBtnBg: '#ffffff',
  headerBtnBorder: 'rgba(5,22,80,0.10)',
  isDark: false,
};

export const COLORS = LIGHT_COLORS;

export const ACCENT_GRADIENT: [string, string] = ['#7c6dfa', '#4facfe'];

export const ACCENT_GRADIENT_OPACITY = (opacity: number): [string, string] => [
  `rgba(124,109,250,${opacity})`,
  `rgba(79,172,254,${opacity})`,
];

// Per-company gradient pairs [from, to]
export const GRADIENTS: [string, string][] = [
  ['#7c6dfa', '#4facfe'],
  ['#2ecc71', '#1abc9c'],
  ['#ff6b35', '#f7c948'],
  ['#e91e63', '#9c27b0'],
  ['#2196f3', '#03a9f4'],
  ['#ff9800', '#ff5722'],
];

// Full card background gradients [top, mid, bottom]
export const CARD_BACKGROUNDS: [string, string, string][] = [
  ['#0f1b3d', '#0d0d14', '#1a0a2e'],
  ['#0f2818', '#0d0d14', '#1a1a08'],
  ['#2d1b10', '#0d0d14', '#1a0d08'],
  ['#2d1030', '#0d0d14', '#0f0a2d'],
  ['#0f1b35', '#0d0d14', '#081a2d'],
  ['#2d1a00', '#0d0d14', '#1a1000'],
];

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADII = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 26,
  title: 30,
};

export const BOTTOM_NAV_HEIGHT = 72;
export const HEADER_HEIGHT = 52;
