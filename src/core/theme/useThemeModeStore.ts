import { create } from 'zustand';

export type ThemeMode = 'system' | 'dark' | 'light';

export type ThemeModeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

/**
 * Creates the theme mode store.
 * The `initialMode` parameter provides a TODO-free seam for SD-004 persistence.
 */
export function createThemeModeStore(initialMode: ThemeMode = 'dark') {
  return create<ThemeModeState>(set => ({
    mode: initialMode,
    setMode: (mode: ThemeMode) => set({ mode }),
  }));
}

export const useThemeModeStore = createThemeModeStore('dark');

