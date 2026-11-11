import { createSetting, type Setting } from '@/core/storage';
import type { ThemeMode } from '@/core/theme/tokens';

/**
 * Persisted user preferences backed by MMKV createSetting.
 */
export const themeModeSetting: Setting<ThemeMode> = createSetting<ThemeMode>(
  'prefs.themeMode',
  'dark',
);

export const hapticsEnabledSetting: Setting<boolean> = createSetting<boolean>(
  'prefs.hapticsEnabled',
  true,
);

export const soundEnabledSetting: Setting<boolean> = createSetting<boolean>(
  'prefs.soundEnabled',
  true,
);
