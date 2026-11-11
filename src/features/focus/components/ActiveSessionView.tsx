import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import { spacing, useTheme } from '@/core/theme';
import {
  Button,
  ProgressRing,
  Screen,
  Text,
  confirm,
} from '@/core/ui';
import { SubjectChip, getSubjectSync } from '@/features/subjects';
import {
  getElapsedMs,
  getFocusedMs,
  getProgress,
  getRemainingMs,
} from '../logic/selectors';
import { formatClock, getStopDialogMessage } from '../logic/timerFormat';
import type { TimerState } from '../logic/types';
import { focusController } from '../services/focusController';
import { useFocusNow } from '../hooks';

function ScreenKeepAwake(): null {
  useKeepAwake();
  return null;
}

function PulsingDot({ isRunning }: { isRunning: boolean }): React.JSX.Element {
  const { tokens } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRunning) {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 600, reduceMotion: ReduceMotion.System }),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
  }, [isRunning, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View
        style={[
          styles.pulsingDot,
          { backgroundColor: tokens.colors.primary },
          animatedStyle,
        ]}
      />
      <Text variant="caption" color="textMuted">
        {isRunning ? 'RECORDING' : 'PAUSED'}
      </Text>
    </View>
  );
}

export type ActiveSessionViewProps = {
  state: TimerState;
};

/**
 * Active timer session screen component.
 * Re-renders once per second via useFocusNow while active.
 */
export function ActiveSessionView({
  state,
}: ActiveSessionViewProps): React.JSX.Element {
  const { tokens } = useTheme();
  const now = useFocusNow();

  const isRunning = state.status === 'running';
  const isPomodoro = state.config.mode === 'pomodoro';
  const isStopwatch = state.config.mode === 'stopwatch';

  // Read-only subject
  const subject = state.config.subjectId
    ? getSubjectSync(state.config.subjectId)
    : null;

  // Phase branding
  const isFocusPhase = state.phase === 'focus';
  const phaseLabel = isFocusPhase
    ? 'FOCUS'
    : state.phase === 'break'
    ? 'BREAK'
    : 'LONG BREAK';
  const phaseColor = isFocusPhase
    ? tokens.colors.primary
    : tokens.colors.success;

  // Remaining / elapsed time & progress
  const remainingMs = getRemainingMs(state, now);
  const elapsedMs = getElapsedMs(state, now);
  const progress = getProgress(state, now) ?? 0;

  const handlePause = async () => {
    await focusController.pause();
  };

  const handleResume = async () => {
    if (state.status === 'awaitingNext') {
      await focusController.startNext();
    } else {
      await focusController.resume();
    }
  };

  const handleStop = async () => {
    const focusedMs = getFocusedMs(state, now);
    const focusedSecs = Math.floor(focusedMs / 1000);
    const message = getStopDialogMessage(focusedSecs);

    const confirmed = await confirm({
      title: 'End session',
      message,
      confirmLabel: 'End Session',
      cancelLabel: 'Keep Going',
      destructive: true,
    });

    if (confirmed) {
      await focusController.stop();
    }
  };

  return (
    <Screen
      scrollable
      style={styles.container}
      accessibilityLabel="Active Focus Session Screen"
    >
      {isRunning && state.config.keepAwake && <ScreenKeepAwake />}

      <View style={styles.content}>
        {/* Header: Subject & Phase */}
        <View style={styles.header}>
          {subject && (
            <View style={styles.chipWrapper}>
              <SubjectChip name={subject.name} color={subject.color} />
            </View>
          )}

          <Text
            variant="caption"
            color="primary"
            style={[styles.phaseLabel, { color: phaseColor }]}
          >
            {phaseLabel}
          </Text>
        </View>

        {/* Center Display: ProgressRing for Countdown/Pomodoro or Big time for Stopwatch */}
        <View style={styles.displayArea}>
          {isStopwatch ? (
            <View style={styles.stopwatchContainer}>
              <Text variant="timer" color="text" style={styles.timerText}>
                {formatClock(elapsedMs, 'stopwatch')}
              </Text>
              <PulsingDot isRunning={isRunning} />
            </View>
          ) : (
            <ProgressRing
              progress={progress}
              size={260}
              strokeWidth={14}
              color={phaseColor}
              duration={900}
              easing={Easing.linear}
              style={styles.ring}
            >
              <View style={styles.ringInner}>
                <Text variant="timer" color="text" style={styles.timerText}>
                  {formatClock(remainingMs ?? 0, state.config.mode)}
                </Text>
                {isPomodoro && (
                  <Text
                    variant="caption"
                    color="textMuted"
                    style={styles.roundText}
                  >
                    Round {state.round} / {state.config.rounds}
                  </Text>
                )}
              </View>
            </ProgressRing>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.controls}>
          {isRunning ? (
            <Button
              title="Pause"
              variant="primary"
              size="lg"
              onPress={handlePause}
              accessibilityLabel="Pause focus timer"
            />
          ) : (
            <Button
              title={state.status === 'awaitingNext' ? 'Start Next Round' : 'Resume'}
              variant="primary"
              size="lg"
              onPress={handleResume}
              accessibilityLabel={
                state.status === 'awaitingNext'
                  ? 'Start next round'
                  : 'Resume focus timer'
              }
            />
          )}

          <View style={styles.buttonSpacer} />

          <Button
            title="Stop"
            variant="secondary"
            size="md"
            onPress={handleStop}
            accessibilityLabel="Stop focus timer"
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  chipWrapper: {
    marginBottom: spacing.xs,
  },
  phaseLabel: {
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  displayArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
  stopwatchContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  pulsingDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ring: {
    marginVertical: spacing.md,
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    textAlign: 'center',
  },
  roundText: {
    marginTop: spacing.xs,
  },
  controls: {
    width: '100%',
    paddingBottom: spacing.lg,
  },
  buttonSpacer: {
    height: spacing.md,
  },
});
