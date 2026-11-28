import React from 'react';
import { StyleSheet, View } from 'react-native';
import { silenceDefaultSetting } from '@/core/prefs';
import { spacing, useTheme } from '@/core/theme';
import { Button, Card, Text, Toggle } from '@/core/ui';
import { dnd } from '../native/DndModule';
import { useSilenceStore } from '../store/silenceStore';

/**
 * Self-contained Silence settings section contributed to `settings.sections`.
 */
export function SilenceSection(): React.JSX.Element {
  const { tokens } = useTheme();
  const silenceDefault = silenceDefaultSetting.useValue();
  const granted = useSilenceStore(s => s.granted);

  return (
    <Card style={styles.card} accessibilityLabel="Silence Settings Section">
      <Text variant="heading" color="text" style={styles.heading}>
        Silence
      </Text>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text variant="body" color="text">
            Silence notifications while focusing
          </Text>
        </View>
        <Toggle
          value={silenceDefault}
          onValueChange={val => silenceDefaultSetting.set(val)}
          accessibilityLabel="Silence notifications while focusing"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text variant="body" color="text">
            Do Not Disturb access
          </Text>
        </View>
        <View style={styles.accessControls}>
          <View
            style={[
              styles.statusChip,
              {
                borderRadius: tokens.radii.pill,
                backgroundColor: tokens.colors.surfaceAlt,
                borderColor: granted ? tokens.colors.success : tokens.colors.danger,
              },
            ]}
          >
            <Text
              variant="caption"
              style={[
                styles.statusText,
                {
                  color: granted ? tokens.colors.success : tokens.colors.danger,
                },
              ]}
            >
              {granted ? 'GRANTED' : 'NOT GRANTED'}
            </Text>
          </View>
          {!granted && (
            <Button
              title="Fix"
              variant="secondary"
              size="md"
              onPress={() => {
                dnd.openPolicyAccessSettings().catch(() => {});
              }}
              accessibilityLabel="Fix Do Not Disturb access"
              style={styles.fixButton}
            />
          )}
        </View>
      </View>

      <Text variant="caption" color="textMuted" style={styles.caption}>
        Android only. Calls and alarms from your priority list still come through.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  heading: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  accessControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '700',
  },
  fixButton: {
    minWidth: 64,
  },
  caption: {
    marginTop: spacing.sm,
  },
});
