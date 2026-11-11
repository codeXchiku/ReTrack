import React from 'react';
import { StyleSheet, View } from 'react-native';
import { formatDuration } from '@/core/time';
import { spacing } from '@/core/theme';
import { Button, Card, Screen, Text } from '@/core/ui';
import { getSubjectSync } from '@/features/subjects';
import { focusController } from '../services/focusController';
import type { FocusResult } from '../store/focusStore';

export type FinishedViewProps = {
  result: FocusResult;
};

/**
 * Basic completion view shown when a focus session finishes or stops.
 */
export function FinishedView({ result }: FinishedViewProps): React.JSX.Element {
  const subject = result.subjectId ? getSubjectSync(result.subjectId) : null;
  const subjectName = subject ? subject.name : 'No subject';

  const title = result.completed ? 'Session complete' : 'Session ended';
  const durationText = formatDuration(result.focusedSecs);
  const savedNote = result.saved
    ? 'Saved to study history'
    : 'Not saved (under 30s)';

  const handleDone = () => {
    focusController.dismissResult();
  };

  return (
    <Screen
      scrollable
      style={styles.container}
      accessibilityLabel="Session Finished Screen"
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text variant="title" color="text" style={styles.title}>
            {title}
          </Text>

          <View style={styles.statsBlock}>
            <Text variant="timer" color="primary" style={styles.duration}>
              {durationText}
            </Text>
            <Text variant="caption" color="textMuted">
              focused time
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" color="textMuted">
              Subject:
            </Text>
            <Text variant="body" color="text" style={styles.bold}>
              {subjectName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" color="textMuted">
              Status:
            </Text>
            <Text variant="body" color="textMuted">
              {savedNote}
            </Text>
          </View>

          {result.saved && result.streakAfter > 0 && (
            <View style={styles.infoRow}>
              <Text variant="body" color="textMuted">
                Streak:
              </Text>
              <Text variant="body" color="primary" style={styles.bold}>
                {result.streakAfter} {result.streakAfter === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}

          <View style={styles.spacer} />

          <Button
            title="Done"
            variant="primary"
            size="lg"
            onPress={handleDone}
            accessibilityLabel="Dismiss session result"
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  statsBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  duration: {
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing.xs,
  },
  bold: {
    fontWeight: '600',
  },
  spacer: {
    height: spacing.lg,
  },
});
