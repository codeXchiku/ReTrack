import { useColorScheme } from 'react-native';
import {
  darkPalette,
  lightPalette,
  radii,
  spacing,
  subjectColors,
  type ThemeTokens,
  typography,
} from './tokens';
import { type ThemeMode, useThemeModeStore } from './useThemeModeStore';

export type ThemeHookResult = {
  tokens: ThemeTokens;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

/**
 * Returns the active theme tokens, darkness flag, and mode controller.
 */
export function useTheme(): ThemeHookResult {
  const mode = useThemeModeStore(state => state.mode);
  const setMode = useThemeModeStore(state => state.setMode);
  const systemScheme = useColorScheme();

  const isDark =
    mode === 'system' ? systemScheme !== 'light' : mode === 'dark';

  const tokens: ThemeTokens = {
    colors: isDark ? darkPalette : lightPalette,
    spacing,
    radii,
    typography,
    subjects: subjectColors,
  };

  return {
    tokens,
    isDark,
    mode,
    setMode,
  };
}

