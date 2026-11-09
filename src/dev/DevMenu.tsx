import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDb } from '@/core/db';
import { eventBus } from '@/core/events';
import { navigateToScreen } from '@/core/navigation';
import { createSetting } from '@/core/storage';
import { formatDuration } from '@/core/time';
import { spacing } from '@/core/theme';
import { Button, Card, Screen, Text } from '@/core/ui';
import {
  focusController,
  useFocusActive,
  useFocusedMs,
  useFocusResult,
  useProgress,
  useRemainingMs,
} from '@/features/focus';
import {
  getSubjectSync,
  NO_SUBJECT_LABEL,
  SubjectPicker,
} from '@/features/subjects';
import { onboardingDone } from '@/features/onboarding';
import {
  clearSessions,
  saveSession,
  useSessionsStore,
  useStreak,
  useSubjectTotals,
  useTodayFocusedSecs,
} from '@/features/sessions';
import { UiGallery } from './UiGallery';

const testStorageSetting = createSetting<string>('settings.testKey', 'not_set');

export function DevMenu(): React.JSX.Element {
  const navigation = useNavigation();
  const [showGallery, setShowGallery] = useState(false);
  const currentTestSettingVal = testStorageSetting.useValue();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const todayFocusedSecs = useTodayFocusedSecs();
  const streak = useStreak();
  const subjectTotals = useSubjectTotals('1970-01-01', '2099-12-31');

  // Focus playground hooks
  const focusActive = useFocusActive();
  const focusRemainingMs = useRemainingMs();
  const focusProgress = useProgress();
  const focusFocusedMs = useFocusedMs();
  const focusResult = useFocusResult();

  const [eventLog, setEventLog] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    const addLog = (name: string, detail: string) => {
      const timeStr = new Date().toTimeString().split(' ')[0] ?? '';
      const entry = {
        id: `${Date.now()}_${Math.random()}`,
        text: `[${timeStr}] ${name}${detail ? ` (${detail})` : ''}`,
      };
      setEventLog(prev => [entry, ...prev.slice(0, 9)]);
    };

    const u1 = eventBus.on('focus/phaseStarted', e =>
      addLog('phaseStarted', `${e.phase} endsAt=${e.endsAt ?? 'null'}`),
    );
    const u2 = eventBus.on('focus/paused', () => addLog('paused', ''));
    const u3 = eventBus.on('focus/resumed', e =>
      addLog('resumed', `${e.phase} endsAt=${e.endsAt ?? 'null'}`),
    );
    const u4 = eventBus.on('focus/awaitingNext', e =>
      addLog('awaitingNext', `round=${e.nextRound}`),
    );
    const u5 = eventBus.on('focus/stopped', () => addLog('stopped', ''));
    const u6 = eventBus.on('focus/finished', e =>
      addLog('finished', `${e.focusedSecs}s done=${e.completed}`),
    );

    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
    };
  }, []);

  const [storageCheckResult, setStorageCheckResult] = useState<{
    settingValue: string;
    dbCreatedAt: string;
  } | null>(null);

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleStorageCheck = async () => {
    const testVal = `val_${Date.now()}`;
    testStorageSetting.set(testVal);
    const readVal = testStorageSetting.get();

    let dbVal = 'error';
    try {
      const db = getDb();
      const row = await db.queryOne<{ value: string }>(
        "SELECT value FROM app_meta WHERE key = 'db_created_at';",
      );
      dbVal = row?.value ?? 'null';
    } catch (e) {
      dbVal = e instanceof Error ? e.message : String(e);
    }

    setStorageCheckResult({
      settingValue: readVal,
      dbCreatedAt: dbVal,
    });
  };

  if (showGallery) {
    return (
      <Screen style={styles.flex}>
        <View style={styles.galleryHeader}>
          <Button
            title="← Back to Dev Menu"
            variant="ghost"
            onPress={() => setShowGallery(false)}
            accessibilityLabel="Back to Dev Menu"
          />
        </View>
        <UiGallery />
      </Screen>
    );
  }

  const handleAdd15m = async () => {
    const now = Date.now();
    await saveSession({
      mode: 'countdown',
      subjectId: selectedSubjectId,
      focusedSecs: 15 * 60,
      startedAt: now - 15 * 60 * 1000,
      endedAt: now,
      completed: true,
    });
  };

  const handleAdd40mYesterday = async () => {
    const yesterdayMs = Date.now() - 24 * 60 * 60 * 1000;
    await saveSession(
      {
        mode: 'countdown',
        subjectId: selectedSubjectId,
        focusedSecs: 40 * 60,
        startedAt: yesterdayMs - 40 * 60 * 1000,
        endedAt: yesterdayMs,
        completed: true,
      },
      { now: yesterdayMs },
    );
  };

  const handleClearSessions = async () => {
    await clearSessions();
    await useSessionsStore.getState().refresh();
  };

  const handleStart2mCountdown = () => {
    focusController.start({
      mode: 'countdown',
      subjectId: selectedSubjectId,
      focusMs: 2 * 60 * 1000,
      breakMs: 0,
      longBreakMs: 0,
      rounds: 1,
      silence: false,
      keepAwake: false,
    });
  };

  const handleStart20s10sPomodoro = () => {
    focusController.start(
      {
        mode: 'pomodoro',
        subjectId: selectedSubjectId,
        focusMs: 20 * 1000,
        breakMs: 10 * 1000,
        longBreakMs: 15 * 1000,
        rounds: 2,
        silence: false,
        keepAwake: false,
      },
      { skipValidation: true },
    );
  };

  const handlePauseFocus = async () => {
    await focusController.pause();
  };

  const handleResumeFocus = async () => {
    await focusController.resume();
  };

  const handleStopFocus = async () => {
    await focusController.stop();
  };

  return (
    <Screen
      scrollable
      style={styles.container}
      accessibilityLabel="Developer Menu Screen"
    >
      <View style={styles.header}>
        <Text variant="title" color="text">
          Developer Menu
        </Text>
        <Text variant="caption" color="textMuted">
          Internal tools & design verification
        </Text>
      </View>

      <Card style={styles.card}>
        <Button
          title="UI Gallery"
          variant="primary"
          onPress={() => setShowGallery(true)}
          accessibilityLabel="Open UI Gallery"
        />

        <View style={styles.spacer} />

        <Button
          title="Storage check"
          variant="secondary"
          onPress={handleStorageCheck}
          accessibilityLabel="Run Storage Check"
        />

        <View style={styles.spacer} />

        <Button
          title="Reset onboarding"
          variant="secondary"
          onPress={() => {
            onboardingDone.set(false);
            setResetMessage('Onboarding reset! (onboarding.done = false)');
          }}
          accessibilityLabel="Reset onboarding"
        />
        {resetMessage && (
          <Text variant="caption" color="primary" style={styles.resetMsg}>
            {resetMessage}
          </Text>
        )}

        <View style={styles.spacer} />

        <Text variant="body" color="text">
          Setting: {currentTestSettingVal}
        </Text>
        {storageCheckResult && (
          <View style={styles.resultBox}>
            <Text variant="caption" color="textMuted">
              Read back: {storageCheckResult.settingValue}
            </Text>
            <Text variant="caption" color="textMuted">
              db_created_at: {storageCheckResult.dbCreatedAt}
            </Text>
          </View>
        )}
      </Card>

      {/* Subjects playground */}
      <Card style={styles.card}>
        <Text variant="heading" color="text" style={styles.sectionTitle}>
          Subjects Playground
        </Text>
        <Text variant="caption" color="textMuted" style={styles.sectionSubtitle}>
          Subject picker & management link
        </Text>

        <View style={styles.pickerRow}>
          <SubjectPicker
            value={selectedSubjectId}
            onChange={setSelectedSubjectId}
          />
        </View>
        <Text variant="caption" color="textMuted">
          Current value: {selectedSubjectId ?? NO_SUBJECT_LABEL}
        </Text>

        <View style={styles.spacer} />

        <Button
          title="Manage Subjects Screen →"
          variant="secondary"
          onPress={() => navigateToScreen('ManageSubjects')}
          accessibilityLabel="Open Manage Subjects screen"
        />
      </Card>

      {/* Sessions playground */}
      <Card style={styles.card}>
        <Text variant="heading" color="text" style={styles.sectionTitle}>
          Sessions Playground
        </Text>
        <Text variant="caption" color="textMuted" style={styles.sectionSubtitle}>
          Study sessions, streaks & live totals
        </Text>

        <Text variant="body" color="text">
          Today: {formatDuration(todayFocusedSecs)} ({todayFocusedSecs}s)
        </Text>
        <Text variant="caption" color="textMuted">
          Streak: {streak.current}d current | {streak.best}d best (Qualified:{' '}
          {streak.todayQualified ? 'Yes' : 'No'})
        </Text>

        <View style={styles.spacer} />

        <Text variant="caption" color="textMuted">
          Per-Subject Totals:
        </Text>
        {subjectTotals.length === 0 ? (
          <Text variant="caption" color="textMuted">
            None recorded
          </Text>
        ) : (
          subjectTotals.map(item => {
            const subject = item.subjectId
              ? getSubjectSync(item.subjectId)
              : null;
            const name = subject ? subject.name : 'No subject';
            return (
              <Text
                key={item.subjectId ?? 'no-subject'}
                variant="caption"
                color="text"
              >
                • {name}: {formatDuration(item.secs)} ({item.secs}s)
              </Text>
            );
          })
        )}

        <View style={styles.spacer} />

        <Button
          title="Add 15m session"
          variant="primary"
          onPress={handleAdd15m}
          accessibilityLabel="Add 15m session"
        />

        <View style={styles.spacer} />

        <Button
          title="Add 40m session (yesterday)"
          variant="secondary"
          onPress={handleAdd40mYesterday}
          accessibilityLabel="Add 40m session yesterday"
        />

        <View style={styles.spacer} />

        <Button
          title="Clear sessions"
          variant="ghost"
          onPress={handleClearSessions}
          accessibilityLabel="Clear all sessions"
        />
      </Card>

      {/* Focus playground */}
      <Card style={styles.card}>
        <Text variant="heading" color="text" style={styles.sectionTitle}>
          Focus Playground
        </Text>
        <Text variant="caption" color="textMuted" style={styles.sectionSubtitle}>
          Timer engine state & live event stream
        </Text>

        {focusActive ? (
          <View style={styles.stateBox}>
            <Text variant="body" color="primary">
              Active: {focusActive.config.mode} ({focusActive.status})
            </Text>
            <Text variant="caption" color="text">
              Phase: {focusActive.phase} | Round: {focusActive.round}/
              {focusActive.config.rounds}
            </Text>
            <Text variant="caption" color="text">
              Remaining:{' '}
              {focusRemainingMs !== null
                ? `${formatDuration(Math.ceil(focusRemainingMs / 1000))} (${focusRemainingMs}ms)`
                : 'null'}
            </Text>
            <Text variant="caption" color="text">
              Focused:{' '}
              {formatDuration(Math.floor(focusFocusedMs / 1000))} (
              {focusFocusedMs}ms)
            </Text>
            <Text variant="caption" color="text">
              Progress:{' '}
              {focusProgress !== null
                ? `${Math.round(focusProgress * 100)}%`
                : 'null'}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color="textMuted">
            No active session
          </Text>
        )}

        {focusResult && (
          <View style={[styles.stateBox, styles.marginTopSm]}>
            <Text variant="caption" color="primary">
              Last result: {focusResult.mode} (focused: {focusResult.focusedSecs}
              s, saved: {focusResult.saved ? 'yes' : 'no'}, completed:{' '}
              {focusResult.completed ? 'yes' : 'no'})
            </Text>
          </View>
        )}

        <View style={styles.spacer} />

        <Button
          title="Start 2m Countdown"
          variant="primary"
          onPress={handleStart2mCountdown}
          accessibilityLabel="Start 2m countdown"
        />

        <View style={styles.spacer} />

        <Button
          title="Start 20s/10s Pomodoro"
          variant="secondary"
          onPress={handleStart20s10sPomodoro}
          accessibilityLabel="Start 20s 10s Pomodoro"
        />

        <View style={styles.spacer} />

        <View style={styles.buttonRow}>
          <View style={styles.flex}>
            <Button
              title="Pause"
              variant="secondary"
              onPress={handlePauseFocus}
              accessibilityLabel="Pause focus timer"
            />
          </View>
          <View style={styles.spacerSm} />
          <View style={styles.flex}>
            <Button
              title="Resume"
              variant="secondary"
              onPress={handleResumeFocus}
              accessibilityLabel="Resume focus timer"
            />
          </View>
          <View style={styles.spacerSm} />
          <View style={styles.flex}>
            <Button
              title="Stop"
              variant="ghost"
              onPress={handleStopFocus}
              accessibilityLabel="Stop focus timer"
            />
          </View>
        </View>

        <View style={styles.spacer} />

        <Text variant="caption" color="textMuted">
          Event Log (last 10):
        </Text>
        {eventLog.length === 0 ? (
          <Text variant="caption" color="textMuted">
            No events yet
          </Text>
        ) : (
          eventLog.map(item => (
            <Text key={item.id} variant="caption" color="text">
              • {item.text}
            </Text>
          ))
        )}
      </Card>

      <View style={styles.footer}>
        <Button
          title="Close Dev Menu"
          variant="ghost"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close Dev Menu"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  spacer: {
    height: spacing.md,
  },
  resultBox: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  resetMsg: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
  },
  galleryHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  stateBox: {
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    gap: 2,
  },
  marginTopSm: {
    marginTop: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacerSm: {
    width: spacing.sm,
  },
});
