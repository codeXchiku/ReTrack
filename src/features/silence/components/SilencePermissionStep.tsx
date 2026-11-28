import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/core/theme';
import { CheckIcon, Text } from '@/core/ui';
import {
  OnboardingStepLayout,
  type OnboardingStepProps,
} from '@/features/onboarding';
import { dnd } from '../native/DndModule';
import { useSilenceStore } from '../store/silenceStore';

/**
 * Onboarding step at order 40 introducing Do Not Disturb silence automation.
 */
export function SilencePermissionStep({
  onContinue,
  onSkip,
}: OnboardingStepProps): React.JSX.Element {
  const { tokens } = useTheme();
  const granted = useSilenceStore(s => s.granted);

  const handleOpenSettings = () => {
    dnd.openPolicyAccessSettings().catch(() => {});
  };

  return (
    <OnboardingStepLayout
      title="Stay in the zone"
      body="Study Dojo can automatically turn on Priority Do Not Disturb while your focus timer runs, and restore your phone's settings when you pause, take a break, or finish."
      primaryLabel={granted ? 'Continue' : 'Open settings'}
      onPrimary={granted ? onContinue : handleOpenSettings}
      secondaryLabel="Skip for now"
      onSecondary={onSkip}
      accessibilityLabel="Silence Permission Onboarding Step"
    >
      {granted ? (
        <View
          style={[
            styles.grantedBox,
            {
              backgroundColor: tokens.colors.surfaceAlt,
              borderColor: tokens.colors.success,
              borderRadius: tokens.radii.md,
            },
          ]}
          accessibilityLabel="Access granted"
        >
          <CheckIcon size={20} color={tokens.colors.success} />
          <Text
            variant="body"
            style={[styles.grantedText, { color: tokens.colors.success }]}
          >
            Access granted
          </Text>
        </View>
      ) : null}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  grantedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  grantedText: {
    fontWeight: '600',
  },
});
