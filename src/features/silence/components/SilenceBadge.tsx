import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/core/theme';
import { Text } from '@/core/ui';
import { useFocusActive } from '@/features/focus';
import { dnd } from '../native/DndModule';
import { useSilenceStore } from '../store/silenceStore';

/**
 * Compact status chip contributed to `focus.activeBadges` during a focus session.
 */
export function SilenceBadge(): React.JSX.Element | null {
  const { tokens } = useTheme();
  const active = useFocusActive();
  const silenceState = useSilenceStore(s => s.state);

  if (
    !active ||
    !active.config.silence ||
    active.phase !== 'focus' ||
    active.status !== 'running'
  ) {
    return null;
  }

  if (silenceState === 'idle') {
    return null;
  }

  if (silenceState === 'active') {
    return (
      <View
        accessibilityLabel="Silence ON"
        style={[
          styles.chip,
          {
            borderRadius: tokens.radii.pill,
            backgroundColor: tokens.colors.surfaceAlt,
            borderColor: tokens.colors.success,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: tokens.colors.success }]} />
        <Text
          variant="caption"
          style={[styles.label, { color: tokens.colors.success }]}
        >
          Silence ON
        </Text>
      </View>
    );
  }

  if (silenceState === 'blocked') {
    return (
      <Pressable
        onPress={() => {
          dnd.openPolicyAccessSettings().catch(() => {});
        }}
        accessibilityRole="button"
        accessibilityLabel="Silence needs permission - tap to fix"
        style={styles.touchableWrapper}
      >
        <View
          style={[
            styles.chip,
            {
              borderRadius: tokens.radii.pill,
              backgroundColor: tokens.colors.surfaceAlt,
              borderColor: tokens.colors.danger,
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: tokens.colors.danger }]} />
          <Text
            variant="caption"
            style={[styles.label, { color: tokens.colors.danger }]}
          >
            Silence needs permission - tap to fix
          </Text>
        </View>
      </Pressable>
    );
  }

  // already_quiet
  return (
    <View
      accessibilityLabel="Already in Do Not Disturb"
      style={[
        styles.chip,
        {
          borderRadius: tokens.radii.pill,
          backgroundColor: tokens.colors.surfaceAlt,
          borderColor: tokens.colors.border,
        },
      ]}
    >
      <Text variant="caption" color="textMuted" style={styles.label}>
        Already in Do Not Disturb
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  touchableWrapper: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
});
