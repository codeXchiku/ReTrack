import React, { type ReactNode } from 'react';
import {
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { Button } from './Button';
import { Text } from './Text';

export type EmptyStateProps = {
  title: string;
  message: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Centered placeholder indicating missing data with optional call-to-action.
 */
export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  accessibilityLabel,
  style,
}: EmptyStateProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? title}
      style={[styles.container, style]}
    >
      {Boolean(icon) && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        variant="title"
        style={[styles.title, { color: tokens.colors.text }]}
      >
        {title}
      </Text>
      <Text
        variant="body"
        style={[styles.message, { color: tokens.colors.textMuted }]}
      >
        {message}
      </Text>
      {Boolean(actionLabel && onAction) && (
        <Button
          title={actionLabel as string}
          onPress={onAction as () => void}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  actionButton: {
    minWidth: 160,
  },
});

