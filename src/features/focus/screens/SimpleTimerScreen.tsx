import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot } from '@/core/registry';
import { spacing } from '@/core/theme';
import {
  BottomSheet,
  Button,
  Chip,
  Screen,
  SegmentedControl,
  Text,
  TextField,
  Toggle,
  showToast,
} from '@/core/ui';
import { SubjectPicker } from '@/features/subjects';
import { ActiveSessionView } from '../components/ActiveSessionView';
import { FinishedView } from '../components/FinishedView';
import { useFocusActive, useFocusResult } from '../hooks';
import { buildConfig, validateConfig } from '../logic/presets';
import { parseCustomMinutes } from '../logic/timerFormat';
import type { TimerMode } from '../logic/types';
import { focusController } from '../services/focusController';

const COUNTDOWN_PRESETS = [15, 30, 45, 60] as const;

export function SimpleTimerScreen(): React.JSX.Element {
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

  return <SimpleTimerForm />;
}

function SimpleTimerForm(): React.JSX.Element {
  // Pre-fill from last configuration if countdown or stopwatch
  const lastConfig = focusController.getLastConfig();
  const initialMode: TimerMode =
    lastConfig?.mode === 'stopwatch' ? 'stopwatch' : 'countdown';
  const initialSubjectId = lastConfig?.subjectId ?? null;
  const initialDurationMin =
    lastConfig?.mode === 'countdown' && lastConfig.focusMs > 0
      ? Math.round(lastConfig.focusMs / (60 * 1000))
      : 30;
  const initialSilence = lastConfig?.silence ?? true;
  const initialKeepAwake = lastConfig?.keepAwake ?? true;

  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [subjectId, setSubjectId] = useState<string | null>(initialSubjectId);
  const [durationMin, setDurationMin] = useState<number>(initialDurationMin);
  const [silence, setSilence] = useState<boolean>(initialSilence);
  const [keepAwake, setKeepAwake] = useState<boolean>(initialKeepAwake);

  // Custom duration sheet state
  const [customSheetVisible, setCustomSheetVisible] = useState(false);
  const [customInputText, setCustomInputText] = useState(String(durationMin));
  const [customError, setCustomError] = useState('');

  const isCustomDuration =
    mode === 'countdown' &&
    !COUNTDOWN_PRESETS.includes(durationMin as (typeof COUNTDOWN_PRESETS)[number]);

  const handleOpenCustomSheet = () => {
    setCustomInputText(String(durationMin));
    setCustomError('');
    setCustomSheetVisible(true);
  };

  const handleApplyCustomMinutes = () => {
    const result = parseCustomMinutes(customInputText);
    if (!result.ok) {
      setCustomError(result.error);
      return;
    }
    setDurationMin(result.minutes);
    setCustomSheetVisible(false);
  };

  const handleStart = () => {
    const config = buildConfig({
      mode,
      subjectId,
      focusMs: mode === 'countdown' ? durationMin * 60 * 1000 : 0,
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
      accessibilityLabel="Simple Timer Setup Screen"
    >
      <View style={styles.formContent}>
        {/* Subject Picker at the top */}
        <View style={styles.pickerSection}>
          <SubjectPicker
            value={subjectId}
            onChange={setSubjectId}
            allowNone
          />
        </View>

        {/* Big time display */}
        <View style={styles.displaySection}>
          {mode === 'countdown' ? (
            <>
              <Text variant="timer" color="text" style={styles.timerDisplay}>
                {durationMin.toString().padStart(2, '0')}:00
              </Text>
              <Text variant="caption" color="textMuted">
                minutes
              </Text>
            </>
          ) : (
            <>
              <Text variant="timer" color="text" style={styles.timerDisplay}>
                00:00
              </Text>
              <Text variant="caption" color="textMuted">
                elapsed
              </Text>
            </>
          )}
        </View>

        {/* Segmented control: Countdown | Stopwatch */}
        <View style={styles.segmentSection}>
          <SegmentedControl
            options={[
              { id: 'countdown', label: 'Countdown' },
              { id: 'stopwatch', label: 'Stopwatch' },
            ]}
            selectedId={mode}
            onSelect={id => setMode(id as TimerMode)}
            accessibilityLabel="Select timer mode"
          />
        </View>

        {/* Presets chips (hidden in stopwatch mode) */}
        {mode === 'countdown' && (
          <View style={styles.presetsSection}>
            <View style={styles.presetChipsRow}>
              {COUNTDOWN_PRESETS.map(preset => (
                <Chip
                  key={preset}
                  label={`${preset}m`}
                  selected={durationMin === preset}
                  onPress={() => setDurationMin(preset)}
                  accessibilityLabel={`Set duration to ${preset} minutes`}
                />
              ))}
              <Chip
                label={isCustomDuration ? `${durationMin}m` : 'Custom'}
                selected={isCustomDuration}
                onPress={handleOpenCustomSheet}
                accessibilityLabel="Set custom duration"
              />
            </View>
          </View>
        )}

        {/* Toggle options */}
        <View style={styles.togglesSection}>
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
              onValueChange={setSilence}
              accessibilityLabel="Toggle silence notifications"
            />
          </View>

          <View style={styles.divider} />

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
              onValueChange={setKeepAwake}
              accessibilityLabel="Toggle keep screen on"
            />
          </View>
        </View>

        {/* Pluggable setup hints slot (e.g. Silence feature permissions) */}
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
            accessibilityLabel="Start focus session"
          />
        </View>
      </View>

      {/* Custom Duration Bottom Sheet */}
      <BottomSheet
        visible={customSheetVisible}
        onClose={() => setCustomSheetVisible(false)}
        accessibilityLabel="Custom duration sheet"
      >
        <View style={styles.sheetContent}>
          <Text variant="heading" color="text">
            Custom Duration
          </Text>
          <Text variant="body" color="textMuted" style={styles.sheetDesc}>
            Enter duration in minutes (1 - 600):
          </Text>

          <TextField
            label="Minutes"
            value={customInputText}
            onChangeText={text => {
              setCustomInputText(text);
              if (customError) {
                setCustomError('');
              }
            }}
            keyboardType="numeric"
            placeholder="e.g. 25"
            error={customError}
            accessibilityLabel="Custom duration input in minutes"
          />

          <View style={styles.sheetActions}>
            <Button
              title="Apply"
              variant="primary"
              size="md"
              onPress={handleApplyCustomMinutes}
              accessibilityLabel="Apply custom duration"
            />
            <View style={styles.sheetButtonSpacer} />
            <Button
              title="Cancel"
              variant="ghost"
              size="md"
              onPress={() => setCustomSheetVisible(false)}
              accessibilityLabel="Cancel custom duration"
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  pickerSection: {
    alignItems: 'flex-start',
  },
  displaySection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  timerDisplay: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  segmentSection: {
    width: '100%',
  },
  presetsSection: {
    width: '100%',
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  togglesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.xs,
  },
  slotSection: {
    width: '100%',
  },
  startSection: {
    width: '100%',
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sheetContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sheetDesc: {
    marginBottom: spacing.xs,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sheetButtonSpacer: {
    width: spacing.md,
  },
});
