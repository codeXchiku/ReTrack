import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/core/theme';
import { Screen, Text } from '@/core/ui';
import { ActiveSessionView } from '../components/ActiveSessionView';
import { FinishedView } from '../components/FinishedView';
import { useFocusActive, useFocusResult } from '../hooks';

export function PomodoroScreen(): React.JSX.Element {
  const activeSession = useFocusActive();
  const lastResult = useFocusResult();

  if (activeSession) {
    return <ActiveSessionView state={activeSession} />;
  }

  if (lastResult) {
    return <FinishedView result={lastResult} />;
  }

  return (
    <Screen style={styles.container} accessibilityLabel="Pomodoro Screen">
      <View style={styles.content}>
        <Text variant="title" color="text" style={styles.title}>
          Pomodoro
        </Text>
        <Text variant="body" color="textMuted">
          Coming in SD-012
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
  },
});
