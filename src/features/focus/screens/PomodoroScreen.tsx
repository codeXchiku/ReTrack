import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot } from '@/core/registry';
import { spacing, useTheme } from '@/core/theme';
import {
  BottomSheet,
  Button,
  Chip,
  ProgressRing,
  Screen,
  Text,
  showToast,
} from '@/core/ui';
import { SubjectPicker } from '@/features/subjects';
import { ActiveSessionView } from '../components/ActiveSessionView';
import { FinishedView } from '../components/FinishedView';
import { RoundDots } from '../components/RoundDots';
import { SessionOptions } from '../components/SessionOptions';
import { useFocusActive, useFocusResult } from '../hooks';
import {
  buildConfig,
  longBreakFor,
  validateConfig,
} from '../logic/presets';
import { formatClock } from '../logic/timerFormat';
import type { TimerConfig } from '../logic/types';
import { focusController } from '../services/focusController';

export function PomodoroScreen(): React.JSX.Element {
  const activeSession = useFocusActive();
  const lastResult = useFocusResult();

  // If a session is active, show the active view regardless of sub-tab
  if (activeSession) {
    return <ActiveSessionView state={activeSession} />;
  }

  // If a result is awaiting dismissal, show the finished view
  if (lastResult) {
    return <FinishedView result={lastResult} />;
  }

  return <PomodoroForm />;
}

function PomodoroForm(): React.JSX.Element {
  const { tokens } = useTheme();
  const lastConfig = focusController.getLastConfig();

  const isLastPomodoro = lastConfig?.mode === 'pomodoro';
  const initialSubjectId = lastConfig?.subjectId ?? null;
  const initialFocusMin =
    isLastPomodoro && lastConfig?.focusMs
      ? Math.round(lastConfig.focusMs / 60000)
      : 25;
  const initialBreakMin =
    isLastPomodoro && lastConfig?.breakMs
      ? Math.round(lastConfig.breakMs / 60000)
      : 5;
  const initialRounds =
    isLastPomodoro && lastConfig?.rounds ? lastConfig.rounds : 4;
  const initialSilence = lastConfig?.silence ?? true;
  const initialKeepAwake = lastConfig?.keepAwake ?? true;

  const [subjectId, setSubjectId] = useState<string | null>(initialSubjectId);
  const [focusMin, setFocusMin] = useState<number>(initialFocusMin);
  const [breakMin, setBreakMin] = useState<number>(initialBreakMin);
  const [rounds, setRounds] = useState<number>(initialRounds);
  const [silence, setSilence] = useState<boolean>(initialSilence);
  const [keepAwake, setKeepAwake] = useState<boolean>(initialKeepAwake);

  // Custom sheet state
  const [customSheetVisible, setCustomSheetVisible] = useState(false);
  const [customFocusMin, setCustomFocusMin] = useState<number>(focusMin);
  const [customBreakMin, setCustomBreakMin] = useState<number>(breakMin);
  const [customRounds, setCustomRounds] = useState<number>(rounds);
  const [customError, setCustomError] = useState<string>('');

  const isStandard25_5 = focusMin === 25 && breakMin === 5 && rounds === 4;
  const isStandard50_10 = focusMin === 50 && breakMin === 10 && rounds === 4;
  const isCustom = !isStandard25_5 && !isStandard50_10;

  const handleSelect25_5 = () => {
    setFocusMin(25);
    setBreakMin(5);
    setRounds(4);
  };

  const handleSelect50_10 = () => {
    setFocusMin(50);
    setBreakMin(10);
    setRounds(4);
  };

  const handleOpenCustomSheet = () => {
    setCustomFocusMin(focusMin);
    setCustomBreakMin(breakMin);
    setCustomRounds(rounds);
    setCustomError('');
    setCustomSheetVisible(true);
  };

  const computedLongBreakMin = Math.round(
    longBreakFor(customBreakMin * 60 * 1000) / 60000,
  );

  const handleApplyCustom = () => {
    const configToValidate: TimerConfig = {
      mode: 'pomodoro',
      subjectId,
      focusMs: customFocusMin * 60 * 1000,
      breakMs: customBreakMin * 60 * 1000,
      longBreakMs: customBreakMin * 60 * 1000 * 3,
      rounds: customRounds,
      silence,
      keepAwake,
    };

    const validation = validateConfig(configToValidate);
    if (!validation.ok) {
      if (validation.error === 'invalid_focus_duration') {
        setCustomError('Focus duration must be between 1 and 180 minutes.');
      } else if (validation.error === 'invalid_break_duration') {
        setCustomError('Break duration must be between 1 and 60 minutes.');
      } else if (validation.error === 'invalid_rounds') {
        setCustomError('Rounds must be between 1 and 8.');
      } else {
        setCustomError('Invalid configuration.');
      }
      return;
    }

    setFocusMin(customFocusMin);
    setBreakMin(customBreakMin);
    setRounds(customRounds);
    setCustomSheetVisible(false);
  };

  const handleStart = () => {
    const config = buildConfig({
      mode: 'pomodoro',
      subjectId,
      focusMs: focusMin * 60 * 1000,
      breakMs: breakMin * 60 * 1000,
      rounds,
      silence,
      keepAwake,
    });

    const validation = validateConfig(config);
    if (!validation.ok) {
      showToast(`Invalid configuration: ${validation.error}`, 'error');
      return;
    }

    const startResult = focusController.start(config);
    if (!startResult.ok) {
      showToast(`Cannot start session: ${startResult.error}`, 'error');
    }
  };

  return (
    <Screen
      scrollable
      style={styles.container}
      accessibilityLabel="Pomodoro Timer Setup Screen"
    >
      <View style={styles.formContent}>
        {/* Subject Picker */}
        <View style={styles.pickerSection}>
          <SubjectPicker
            value={subjectId}
            onChange={setSubjectId}
            allowNone
          />
        </View>

        {/* Big Ring Preview with First Focus Duration and Round Indicator */}
        <View style={styles.previewSection}>
          <ProgressRing
            progress={1}
            size={240}
            strokeWidth={12}
            color={tokens.colors.focus}
            style={styles.previewRing}
          >
            <View style={styles.previewInner}>
              <Text variant="timer" color="text" style={styles.previewTime}>
                {formatClock(focusMin * 60 * 1000, 'pomodoro')}
              </Text>
              <Text
                variant="caption"
                color="textMuted"
                style={styles.previewCaption}
              >
                FOCUS 1 / {rounds}
              </Text>
            </View>
          </ProgressRing>

          {/* Round dots */}
          <View style={styles.dotsWrapper}>
            <RoundDots
              totalRounds={rounds}
              currentRound={1}
              phase="focus"
              status="paused"
              color={tokens.colors.focus}
            />
          </View>
        </View>

        {/* Preset chips */}
        <View style={styles.presetsSection}>
          <Text variant="caption" color="textMuted" style={styles.presetsLabel}>
            PRESETS
          </Text>
          <View style={styles.chipsRow}>
            <Chip
              label="25 / 5"
              selected={isStandard25_5}
              onPress={handleSelect25_5}
              accessibilityLabel="Select 25 minute focus, 5 minute break"
            />
            <Chip
              label="50 / 10"
              selected={isStandard50_10}
              onPress={handleSelect50_10}
              accessibilityLabel="Select 50 minute focus, 10 minute break"
            />
            <Chip
              label={
                isCustom
                  ? `${focusMin}/${breakMin} (${rounds}r)`
                  : 'Custom'
              }
              selected={isCustom}
              onPress={handleOpenCustomSheet}
              accessibilityLabel="Custom pomodoro configuration"
            />
          </View>
        </View>

        {/* Shared Session Options (Silence notifications & Keep screen on) */}
        <SessionOptions
          silence={silence}
          onSilenceChange={setSilence}
          keepAwake={keepAwake}
          onKeepAwakeChange={setKeepAwake}
        />

        {/* Setup hints slot */}
        <View style={styles.slotSection}>
          <Slot name="focus.setupHints" />
        </View>

        {/* Big primary START button */}
        <View style={styles.startSection}>
          <Button
            title="START"
            variant="primary"
            size="lg"
            onPress={handleStart}
            accessibilityLabel="Start pomodoro session"
          />
        </View>
      </View>

      {/* Custom Pomodoro Configuration Sheet */}
      <BottomSheet
        visible={customSheetVisible}
        onClose={() => setCustomSheetVisible(false)}
        accessibilityLabel="Custom pomodoro configuration sheet"
      >
        <View style={styles.sheetContent}>
          <Text variant="heading" color="text">
            Custom Pomodoro
          </Text>
          <Text variant="caption" color="textMuted" style={styles.sheetSubtitle}>
            Configure durations and rounds
          </Text>

          {/* Stepper: Focus Duration (1 - 180 min) */}
          <StepperRow
            label="Focus duration"
            value={customFocusMin}
            unit="min"
            min={1}
            max={180}
            step={5}
            onValueChange={setCustomFocusMin}
          />

          {/* Stepper: Break Duration (1 - 60 min) */}
          <StepperRow
            label="Short break"
            value={customBreakMin}
            unit="min"
            min={1}
            max={60}
            step={1}
            onValueChange={setCustomBreakMin}
          />

          {/* Stepper: Rounds (1 - 8) */}
          <StepperRow
            label="Rounds"
            value={customRounds}
            unit=""
            min={1}
            max={8}
            step={1}
            onValueChange={setCustomRounds}
          />

          {/* Computed long break display */}
          <View
            style={[
              styles.longBreakNotice,
              { backgroundColor: tokens.colors.surfaceAlt },
            ]}
          >
            <Text variant="caption" color="textMuted">
              Long break: {computedLongBreakMin} min
            </Text>
            <Text variant="caption" color="textMuted">
              (runs automatically after round {customRounds})
            </Text>
          </View>

          {customError !== '' && (
            <Text variant="caption" color="danger" style={styles.sheetError}>
              {customError}
            </Text>
          )}

          <View style={styles.sheetActions}>
            <Button
              title="Apply"
              variant="primary"
              size="md"
              onPress={handleApplyCustom}
              accessibilityLabel="Apply custom pomodoro configuration"
            />
            <Button
              title="Cancel"
              variant="ghost"
              size="md"
              onPress={() => setCustomSheetVisible(false)}
              accessibilityLabel="Cancel custom pomodoro configuration"
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

interface StepperRowProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onValueChange: (val: number) => void;
}

function StepperRow({
  label,
  value,
  unit,
  min,
  max,
  step,
  onValueChange,
}: StepperRowProps): React.JSX.Element {
  const { tokens } = useTheme();

  const handleDecrement = () => {
    const next = Math.max(min, value - step);
    onValueChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step);
    onValueChange(next);
  };

  return (
    <View style={styles.stepperRow}>
      <Text variant="body" color="text" style={styles.stepperLabel}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <Button
          title="-"
          variant="secondary"
          size="md"
          onPress={handleDecrement}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label}`}
          style={styles.stepperBtn}
        />
        <View
          style={[
            styles.stepperValueContainer,
            { backgroundColor: tokens.colors.surface },
          ]}
        >
          <Text variant="heading" color="text" style={styles.stepperValueText}>
            {value}
            {unit ? ` ${unit}` : ''}
          </Text>
        </View>
        <Button
          title="+"
          variant="secondary"
          size="md"
          onPress={handleIncrement}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label}`}
          style={styles.stepperBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
  },
  pickerSection: {
    marginBottom: spacing.md,
  },
  previewSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  previewRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTime: {
    textAlign: 'center',
  },
  previewCaption: {
    marginTop: spacing.xs,
    letterSpacing: 1.5,
  },
  dotsWrapper: {
    marginTop: spacing.md,
  },
  presetsSection: {
    marginVertical: spacing.md,
  },
  presetsLabel: {
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotSection: {
    marginVertical: spacing.sm,
  },
  startSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  sheetContent: {
    paddingBottom: spacing.lg,
  },
  sheetSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stepperLabel: {
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperBtn: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: spacing.sm,
  },
  stepperValueContainer: {
    minWidth: 70,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  stepperValueText: {
    textAlign: 'center',
  },
  longBreakNotice: {
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  sheetError: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
