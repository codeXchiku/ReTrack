import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/core/theme';
import { Screen, Text } from '@/core/ui';

export function HomeScreen(): React.JSX.Element {
  return (
    <Screen style={styles.container} accessibilityLabel="Home Screen">
      <View style={styles.content}>
        <Text variant="title" color="text" style={styles.title}>
          Home
        </Text>
        <Text variant="body" color="textMuted">
          Coming in SD-006
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
