import React, { type ReactNode } from 'react';
import {
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/core/theme';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onPress?: () => void;
};

/**
 * Surface container with theme radius md and surface background.
 */
export function Card({
  children,
  style,
  accessibilityLabel,
  onPress,
}: CardProps): React.JSX.Element {
  const { tokens } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[containerStyle, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[containerStyle, style]}
    >
      {children}
    </View>
  );
}

