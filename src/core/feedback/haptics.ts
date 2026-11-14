import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { hapticsEnabledSetting } from '@/core/prefs';

export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const HAPTIC_MAP: Record<HapticKind, HapticFeedbackTypes> = {
  light: HapticFeedbackTypes?.impactLight ?? ('impactLight' as HapticFeedbackTypes),
  medium: HapticFeedbackTypes?.impactMedium ?? ('impactMedium' as HapticFeedbackTypes),
  success: HapticFeedbackTypes?.notificationSuccess ?? ('notificationSuccess' as HapticFeedbackTypes),
  warning: HapticFeedbackTypes?.notificationWarning ?? ('notificationWarning' as HapticFeedbackTypes),
};

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Triggers a native haptic feedback pulse if haptics are enabled in user preferences.
 * Reads preferences dynamically at call time and safely wraps any library or hardware errors.
 */
export function haptic(kind: HapticKind): void {
  try {
    const isEnabled = hapticsEnabledSetting.get();
    if (!isEnabled) {
      return;
    }

    const type = HAPTIC_MAP[kind];
    if (!type) {
      return;
    }

    ReactNativeHapticFeedback.trigger(type, HAPTIC_OPTIONS);
  } catch {
    // Never throws, safely ignores library errors or unsupported hardware
  }
}
