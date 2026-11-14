import React from 'react';
import { StyleSheet, View } from 'react-native';
import { formatDuration } from '@/core/time';
import { spacing } from '@/core/theme';
import { Button, Card, Celebration, FlameBadge, Screen, Text } from '@/core/ui';
import { getSubjectSync } from '@/features/subjects';
import { pomodoroStoppedEarlyText } from '../logic/labels';
import { focusController } from '../services/focusController';
import type { FocusResult } from '../store/focusStore';

export type FinishedViewProps = {
  result: FocusResult;
};

/**
 * Completion view shown when a focus session finishes or stops.
 * Features celebration confetti burst and streak milestone badges.
 */
export function FinishedView({ result }: FinishedViewProps): React.JSX.Element {
  const subject = result.subjectId ? getSubjectSync(result.subjectId) : null;
  const subjectName = subject ? subject.name : 'No subject';

  const title = result.completed ? 'Session complete' : 'Session ended';
  const durationText = formatDuration(result.focusedSecs);
  const isPomodoro = result.mode === 'pomodoro';
  const pomodoroSubtitle = isPomodoro
    ? result.completed
      ? `${result.rounds} ${result.rounds === 1 ? 'round' : 'rounds'} - ${durationText} focused`
      : pomodoroStoppedEarlyText(result.rounds)
    : null;

  const handleDone = () => {
    focusController.dismissResult();
  };

  const isStreakIncrement = result.streakAfter > result.streakBefore;
  const streakDaysText = `${result.streakAfter} ${result.streakAfter === 1 ? 'day' : 'days'}`;

  // Celebration plays only when session completed naturally and was saved
  const showCelebration = result.completed && result.saved;

  return (
    <Screen
      scrollable
      style={styles.container}
      accessibilityLabel="Session Finished Screen"
    >
      {showCelebration && <Celebration runKey={result.sessionId} />}

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text variant="title" color="text" style={styles.title}>
            {title}
          </Text>

          {pomodoroSubtitle && (
            <Text
              variant="body"
              color="primary"
              style={styles.pomodoroSubtitle}
            >
              {pomodoroSubtitle}
            </Text>
          )}

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

          {result.saved ? (
            <View style={styles.streakSection}>
              {isStreakIncrement ? (
                <View style={styles.streakIncrementContainer}>
                  <FlameBadge streak={result.streakAfter} />
                  <Text variant="body" color="primary" style={styles.streakIncrementText}>
                    {`Streak +1! Day ${result.streakAfter}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text variant="body" color="textMuted">
                    Streak:
                  </Text>
                  <Text variant="body" color="text" style={styles.bold}>
                    {`Current streak: ${streakDaysText}`}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Text variant="body" color="textMuted">
                Status:
              </Text>
              <Text variant="body" color="textMuted">
                Too short to save
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  pomodoroSubtitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
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
  streakSection: {
    width: '100%',
  },
  streakIncrementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  streakIncrementText: {
    fontWeight: '700',
  },
  spacer: {
    height: spacing.lg,
  },
});
