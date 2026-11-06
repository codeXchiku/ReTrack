import type { TextStyle } from 'react-native';

export type ColorPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  focus: string;
  accent: string;
  success: string;
  danger: string;
  border: string;
};

export type ColorToken = keyof ColorPalette;

export const darkPalette: ColorPalette = {
  background: '#1B1E3A',
  surface: '#2A2E55',
  surfaceAlt: '#3A3F70',
  text: '#FFFFFF',
  textMuted: '#8C90B5',
  primary: '#FFD23F',
  onPrimary: '#14141F',
  focus: '#FF4B3E',
  accent: '#3A6FF7',
  success: '#2EC4B6',
  danger: '#FF4B3E',
  border: '#3A3F70',
};

export const lightPalette: ColorPalette = {
  background: '#F2F3FF',
  surface: '#FFFFFF',
  surfaceAlt: '#E6E8FA',
  text: '#14141F',
  textMuted: '#5A5F88',
  primary: '#FFD23F',
  onPrimary: '#14141F',
  focus: '#E5392D',
  accent: '#3A6FF7',
  success: '#1FA89B',
  danger: '#E5392D',
  border: '#C9CCE8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

export const typography: Record<
  'display' | 'title' | 'heading' | 'body' | 'caption' | 'timer',
  TextStyle
> = {
  display: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
    fontVariant: ['tabular-nums'],
  },
};

export type TypographyToken = keyof typeof typography;

export type SubjectColor = {
  id: string;
  name: string;
  color: string;
};

export const subjectColors: readonly SubjectColor[] = [
  { id: 'blue', name: 'Blue', color: '#3B82F6' },
  { id: 'red', name: 'Red', color: '#EF4444' },
  { id: 'teal', name: 'Teal', color: '#14B8A6' },
  { id: 'yellow', name: 'Yellow', color: '#FACC15' },
  { id: 'pink', name: 'Pink', color: '#EC4899' },
  { id: 'purple', name: 'Purple', color: '#8B5CF6' },
  { id: 'orange', name: 'Orange', color: '#FB923C' },
  { id: 'green', name: 'Green', color: '#4ADE80' },
] as const;

export type ThemeTokens = {
  colors: ColorPalette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  subjects: typeof subjectColors;
};

