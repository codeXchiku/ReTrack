import React from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  colorDot?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Filter or selection chip with optional subject color indicator.
 */
export function Chip({
  label,
  selected = false,
  colorDot,
  onPress,
  accessibilityLabel,
  style,
}: ChipProps): React.JSX.Element {
  const { tokens } = useTheme();

  const isClickable = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!isClickable}
      accessibilityRole={isClickable ? 'button' : undefined}
      accessibilityState={isClickable ? { selected } : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={[
        styles.container,
        {
          borderRadius: tokens.radii.pill,
          backgroundColor: selected
            ? tokens.colors.primary
            : tokens.colors.surfaceAlt,
          borderColor: selected ? tokens.colors.primary : tokens.colors.border,
        },
        style,
      ]}
    >
      {Boolean(colorDot) && (
        <View
          style={[styles.dot, { backgroundColor: colorDot }]}
        />
      )}
      <Text
        variant="caption"
        style={[
          styles.label,
          {
            color: selected
              ? tokens.colors.onPrimary
              : tokens.colors.text,
          },
          selected ? styles.selectedLabel : styles.unselectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    minHeight: 36,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    lineHeight: 16,
  },
  selectedLabel: {
    fontWeight: '700',
  },
  unselectedLabel: {
    fontWeight: '500',
  },
});

