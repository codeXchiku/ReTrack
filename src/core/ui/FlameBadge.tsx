import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { spacing, useTheme } from '@/core/theme';
import { FlameIcon } from './icons';
import { Text } from './Text';

export interface FlameBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Flame badge displaying a streak count and an icon with a subtle one-time scale pulse on mount.
 */
export function FlameBadge({ streak, size = 'md' }: FlameBadgeProps): React.JSX.Element {
  const { tokens } = useTheme();
  const colors = tokens.colors;
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 250 }),
        withTiming(1, { duration: 200 }),
      );
    }
  }, [reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.surfaceAlt }, animatedStyle]}
      accessibilityLabel={`Streak ${streak} ${streak === 1 ? 'day' : 'days'}`}
    >
      <FlameIcon size={iconSize} color={colors.primary} />
      <View style={styles.textWrapper}>
        <Text variant={size === 'sm' ? 'caption' : 'body'} color="primary" style={styles.streakText}>
          {streak}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    alignSelf: 'center',
  },
  textWrapper: {
    marginLeft: spacing.xs,
  },
  streakText: {
    fontWeight: '700',
  },
});
