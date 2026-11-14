import React from 'react';
import notifee from '@notifee/react-native';
import {
  OnboardingStepLayout,
  type OnboardingStepProps,
} from '@/features/onboarding';

/**
 * Onboarding step at order 50 prompting user to grant notification permissions.
 */
export function NotificationPermissionStep({
  onContinue,
  onSkip,
}: OnboardingStepProps): React.JSX.Element {
  const handleAllow = async () => {
    try {
      await notifee.requestPermission();
    } catch {
      // Permission request failures are handled gracefully
    }
    onContinue();
  };

  const handleNotNow = () => {
    onSkip();
  };

  return (
    <OnboardingStepLayout
      title="Stay on track"
      body="Study Dojo uses notifications to show a live countdown while you're in other apps, and alert you when focus or break sessions end."
      primaryLabel="Allow notifications"
      onPrimary={handleAllow}
      secondaryLabel="Not now"
      onSecondary={handleNotNow}
      accessibilityLabel="Notification Permission Onboarding Step"
    />
  );
}
