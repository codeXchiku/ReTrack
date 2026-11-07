import { create } from 'zustand';
import { themeModeSetting } from '@/core/prefs';
import type { ThemeMode } from './tokens';

export type { ThemeMode } from './tokens';

export type ThemeModeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

/**
 * Creates the theme mode store, connected to persistent MMKV setting.
 */
export function createThemeModeStore(
  initialMode: ThemeMode = themeModeSetting.get(),
) {
  const store = create<ThemeModeState>(set => ({
    mode: initialMode,
    setMode: (mode: ThemeMode) => {
      themeModeSetting.set(mode);
      set({ mode });
    },
  }));

  // Sync state if setting changes externally
  themeModeSetting.subscribe(newMode => {
    store.setState({ mode: newMode });
  });

  return store;
}

export const useThemeModeStore = createThemeModeStore();

