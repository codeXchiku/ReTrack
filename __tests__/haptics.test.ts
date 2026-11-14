import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticsEnabledSetting } from '@/core/prefs';
import { haptic, type HapticKind } from '@/core/feedback';

describe('haptics module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hapticsEnabledSetting.set(true);
  });

  it('triggers impactLight when kind is light and haptics are enabled', () => {
    haptic('light');

    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledTimes(1);
    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'impactLight',
      expect.objectContaining({
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      }),
    );
  });

  it('triggers impactMedium when kind is medium', () => {
    haptic('medium');

    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'impactMedium',
      expect.anything(),
    );
  });

  it('triggers notificationSuccess when kind is success', () => {
    haptic('success');

    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'notificationSuccess',
      expect.anything(),
    );
  });

  it('triggers notificationWarning when kind is warning', () => {
    haptic('warning');

    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'notificationWarning',
      expect.anything(),
    );
  });

  it('does not trigger feedback when haptics are disabled in user preferences', () => {
    hapticsEnabledSetting.set(false);

    haptic('success');
    haptic('light');

    expect(ReactNativeHapticFeedback.trigger).not.toHaveBeenCalled();
  });

  it('reads preferences at call time rather than caching', () => {
    hapticsEnabledSetting.set(false);
    haptic('light');
    expect(ReactNativeHapticFeedback.trigger).not.toHaveBeenCalled();

    // Dynamically enable
    hapticsEnabledSetting.set(true);
    haptic('light');
    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledTimes(1);

    // Dynamically disable
    hapticsEnabledSetting.set(false);
    haptic('medium');
    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledTimes(1);
  });

  it('never throws when the underlying library throws an error', () => {
    jest.spyOn(ReactNativeHapticFeedback, 'trigger').mockImplementationOnce(() => {
      throw new Error('Device has no vibrator');
    });

    expect(() => {
      haptic('light');
    }).not.toThrow();
  });

  it('safely handles unknown kind without throwing', () => {
    // Narrowing bypass for edge-case runtime test
    const invalidKind = 'unknown-kind' as unknown as HapticKind;

    expect(() => {
      haptic(invalidKind);
    }).not.toThrow();

    expect(ReactNativeHapticFeedback.trigger).not.toHaveBeenCalled();
  });
});
