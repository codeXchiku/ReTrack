import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/core/theme';
import { Screen, Text } from '@/core/ui';

export function ReviewScreen(): React.JSX.Element {
  return (
    <Screen style={styles.container} accessibilityLabel="Card Review Screen">
      <View style={styles.content}>
        <Text variant="title" color="text" style={styles.title}>
          Review
        </Text>
        <Text variant="body" color="textMuted">
          Coming in SD-011
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
