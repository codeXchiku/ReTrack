import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/core/theme';
import { Text, Toggle } from '@/core/ui';

export type SessionOptionsProps = {
  silence: boolean;
  onSilenceChange: (val: boolean) => void;
  keepAwake: boolean;
  onKeepAwakeChange: (val: boolean) => void;
};

/**
 * Shared toggles for session settings: silence notifications and keep screen on.
 */
export function SessionOptions({
  silence,
  onSilenceChange,
  keepAwake,
  onKeepAwakeChange,
}: SessionOptionsProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelContainer}>
          <Text variant="body" color="text">
            Silence notifications
          </Text>
          <Text variant="caption" color="textMuted">
            Enable Do Not Disturb while focusing
          </Text>
        </View>
        <Toggle
          value={silence}
          onValueChange={onSilenceChange}
          accessibilityLabel="Toggle silence notifications"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelContainer}>
          <Text variant="body" color="text">
            Keep screen on
          </Text>
          <Text variant="caption" color="textMuted">
            Prevent display from sleeping while running
          </Text>
        </View>
        <Toggle
          value={keepAwake}
          onValueChange={onKeepAwakeChange}
          accessibilityLabel="Toggle keep screen on"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
});
