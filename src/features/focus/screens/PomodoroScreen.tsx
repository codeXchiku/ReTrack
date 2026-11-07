import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/core/theme';
import { Screen, Text } from '@/core/ui';

export function PomodoroScreen(): React.JSX.Element {
  return (
    <Screen style={styles.container} accessibilityLabel="Pomodoro Screen">
      <View style={styles.content}>
        <Text variant="title" color="text" style={styles.title}>
          Pomodoro
        </Text>
        <Text variant="body" color="textMuted">
          Coming in SD-008
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
