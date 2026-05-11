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
  bg: '#0d0d14',
  bgDeep: '#0a0a0f',
  accent: '#7c6dfa',
  accentLight: '#a89cfc',
  success: '#2ecc71',
  successLight: '#5ddb8f',
  warning: '#ffc107',
  danger: '#ff4444',

  white: '#ffffff',
  black: '#000000',
  text: 'rgba(255,255,255,0.9)',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.35)',

  cardBorder: 'rgba(255,255,255,0.07)',
  cardBg: 'rgba(255,255,255,0.05)',

  navBg: 'rgba(10,10,18,0.97)',
  navBorder: 'rgba(255,255,255,0.06)',

  headerBtnBg: 'rgba(255,255,255,0.08)',
  headerBtnBorder: 'rgba(255,255,255,0.1)',
  isDark: true,
};

export const LIGHT_COLORS: ThemeColors = {
  bg: '#f2f2f7',
  bgDeep: '#ffffff',
  accent: '#6c5ce7',
  accentLight: '#8b7ff5',
  success: '#2ecc71',
  successLight: '#5ddb8f',
  warning: '#f59e0b',
  danger: '#ef4444',

  white: '#ffffff',
  black: '#000000',
  text: 'rgba(0,0,0,0.88)',
  textMuted: 'rgba(0,0,0,0.5)',
  textDim: 'rgba(0,0,0,0.3)',

  cardBorder: 'rgba(0,0,0,0.08)',
  cardBg: 'rgba(0,0,0,0.04)',

  navBg: 'rgba(242,242,247,0.95)',
  navBorder: 'rgba(0,0,0,0.1)',

  headerBtnBg: 'rgba(0,0,0,0.06)',
  headerBtnBorder: 'rgba(0,0,0,0.1)',
  isDark: false,
};

export const COLORS = DARK_COLORS;

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
