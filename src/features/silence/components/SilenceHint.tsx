import React, { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { silenceDefaultSetting } from '@/core/prefs';
import { spacing, useTheme } from '@/core/theme';
import { Button, Card, Text } from '@/core/ui';
import { dnd } from '../native/DndModule';
import { useSilenceStore } from '../store/silenceStore';

// In-memory dismissal flag: persists across sub-tabs until next app launch
let hintDismissedInMemory = false;
const listeners = new Set<() => void>();

function subscribeHintDismissed(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getHintDismissedSnapshot(): boolean {
  return hintDismissedInMemory;
}

export function dismissSilenceHint(): void {
  hintDismissedInMemory = true;
  listeners.forEach(fn => fn());
}

export function resetSilenceHintForTest(): void {
  hintDismissedInMemory = false;
  listeners.forEach(fn => fn());
}

/**
 * Hint card contributed to `focus.setupHints` prompting the user to grant
 * Do Not Disturb policy access when silence is enabled by default.
 */
export function SilenceHint(): React.JSX.Element | null {
  const { tokens } = useTheme();
  const silenceDefault = silenceDefaultSetting.useValue();
  const granted = useSilenceStore(s => s.granted);
  const dismissed = useSyncExternalStore(
    subscribeHintDismissed,
    getHintDismissedSnapshot,
    getHintDismissedSnapshot,
  );

  if (!silenceDefault || granted || dismissed) {
    return null;
  }

  return (
    <Card
      style={[
        styles.card,
        { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.surfaceAlt },
      ]}
      accessibilityLabel="Do Not Disturb Permission Hint"
    >
      <Text variant="body" color="text" style={styles.message}>
        Allow Do Not Disturb access so Study Dojo can silence your phone while you focus.
      </Text>
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button
            title="Allow"
            variant="primary"
            size="md"
            onPress={() => {
              dnd.openPolicyAccessSettings().catch(() => {});
            }}
            accessibilityLabel="Allow Do Not Disturb access"
          />
        </View>
        <View style={styles.actionSpacer} />
        <View style={styles.actionButton}>
          <Button
            title="Not now"
            variant="ghost"
            size="md"
            onPress={dismissSilenceHint}
            accessibilityLabel="Dismiss Do Not Disturb hint"
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
  },
  message: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  actionSpacer: {
    width: spacing.sm,
  },
});
