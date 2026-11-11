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
import { Slot } from '@/core/registry';
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
  awaitingNextTitle,
  phaseTitle,
  roundLabel,
} from '../logic/labels';
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
import { RoundDots } from './RoundDots';

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
 * Supports Countdown, Stopwatch, and full Pomodoro phase states.
 */
export function ActiveSessionView({
  state,
}: ActiveSessionViewProps): React.JSX.Element {
  const { tokens } = useTheme();
  const now = useFocusNow();

  const isRunning = state.status === 'running';
  const isAwaitingNext = state.status === 'awaitingNext';
  const isPomodoro = state.config.mode === 'pomodoro';
  const isStopwatch = state.config.mode === 'stopwatch';
  const isFocusPhase = state.phase === 'focus';
  const isBreakPhase = state.phase === 'break' || state.phase === 'longBreak';

  // Read-only subject
  const subject = state.config.subjectId
    ? getSubjectSync(state.config.subjectId)
    : null;

  // Phase branding
  const phaseLabelText = phaseTitle(state);
  const phaseColor =
    isPomodoro && isFocusPhase
      ? tokens.colors.focus
      : isFocusPhase
      ? tokens.colors.primary
      : tokens.colors.success;

  // Remaining / elapsed time & progress
  const remainingMs = getRemainingMs(state, now);
  const elapsedMs = getElapsedMs(state, now);
  const progress = getProgress(state, now) ?? 0;

  // 250ms crossfade animation on phase/status change
  const fadeAnim = useSharedValue(1);
  useEffect(() => {
    fadeAnim.value = 0;
    fadeAnim.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.ease),
      reduceMotion: ReduceMotion.System,
    });
  }, [state.phase, state.status, fadeAnim]);

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

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

  const handleSkipBreak = async () => {
    await focusController.skipBreak();
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

          {!isAwaitingNext && (
            <Text
              variant="caption"
              color="primary"
              style={[styles.phaseLabel, { color: phaseColor }]}
            >
              {phaseLabelText}
            </Text>
          )}
        </View>

        {/* Center Display with 250ms crossfade on phase change */}
        <Animated.View style={[styles.displayArea, fadeAnimatedStyle]}>
          {isAwaitingNext ? (
            /* Calm awaitingNext view: no countdown */
            <View style={styles.awaitingNextBox}>
              <Text variant="title" color="text" style={styles.awaitingTitle}>
                {awaitingNextTitle(state.round + 1)}
              </Text>
              <Text variant="body" color="textMuted" style={styles.awaitingSub}>
                Take a breath before resuming.
              </Text>

              {isPomodoro && (
                <View style={styles.dotsWrapper}>
                  <RoundDots
                    totalRounds={state.config.rounds}
                    currentRound={state.round}
                    phase={state.phase}
                    status="awaitingNext"
                    color={tokens.colors.focus}
                  />
                </View>
              )}
            </View>
          ) : isStopwatch ? (
            /* Stopwatch Display */
            <View style={styles.stopwatchContainer}>
              <Text variant="timer" color="text" style={styles.timerText}>
                {formatClock(elapsedMs, 'stopwatch')}
              </Text>
              <PulsingDot isRunning={isRunning} />
            </View>
          ) : (
            /* Countdown / Pomodoro Progress Ring */
            <View style={styles.ringWrapper}>
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
                      {roundLabel(state)}
                    </Text>
                  )}
                </View>
              </ProgressRing>

              {/* Round dots for Pomodoro */}
              {isPomodoro && (
                <View style={styles.dotsWrapper}>
                  <RoundDots
                    totalRounds={state.config.rounds}
                    currentRound={state.round}
                    phase={state.phase}
                    status={state.status}
                    color={phaseColor}
                  />
                </View>
              )}

              {/* Break friendly message and pluggable panel */}
              {isBreakPhase && (
                <View style={styles.breakSection}>
                  <Text
                    variant="body"
                    color="textMuted"
                    style={styles.breakFriendlyText}
                  >
                    Stretch, drink water, rest your eyes
                  </Text>
                  <View style={styles.breakPanelSlot}>
                    <Slot name="focus.breakPanel" />
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Action Controls */}
        <View style={styles.controls}>
          {isAwaitingNext ? (
            /* awaitingNext: Primary Start round N + Secondary End session */
            <>
              <Button
                title={`Start round ${state.round + 1}`}
                variant="primary"
                size="lg"
                onPress={handleResume}
                accessibilityLabel={`Start round ${state.round + 1}`}
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="End session"
                variant="secondary"
                size="md"
                onPress={handleStop}
                accessibilityLabel="End session"
              />
            </>
          ) : (
            /* Running / Paused controls */
            <>
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
                  title="Resume"
                  variant="primary"
                  size="lg"
                  onPress={handleResume}
                  accessibilityLabel="Resume focus timer"
                />
              )}

              {/* Skip break button during break or long break */}
              {isBreakPhase && (
                <>
                  <View style={styles.buttonSpacer} />
                  <Button
                    title="Skip break"
                    variant="secondary"
                    size="md"
                    onPress={handleSkipBreak}
                    accessibilityLabel="Skip break and start next phase"
                  />
                </>
              )}

              <View style={styles.buttonSpacer} />

              <Button
                title="Stop"
                variant="secondary"
                size="md"
                onPress={handleStop}
                accessibilityLabel="Stop focus timer"
              />
            </>
          )}
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
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
    minHeight: 60,
  },
  chipWrapper: {
    marginBottom: spacing.xs,
  },
  phaseLabel: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  displayArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: 1,
  },
  dotsWrapper: {
    marginTop: spacing.md,
  },
  breakSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  breakFriendlyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  breakPanelSlot: {
    width: '100%',
  },
  awaitingNextBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  awaitingTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  awaitingSub: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stopwatchContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  pulsingDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    paddingBottom: spacing.lg,
    width: '100%',
  },
  buttonSpacer: {
    height: spacing.md,
  },
});
