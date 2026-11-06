import React, { useEffect } from 'react';
import {
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';

export type ProgressBarProps = {
  progress: number; // 0 to 1
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Animated linear progress bar.
 */
export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 6,
  style,
  accessibilityLabel = 'Progress indicator',
}: ProgressBarProps): React.JSX.Element {
  const { tokens } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const animatedProgress = useSharedValue(clamped);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration: 300,
      reduceMotion: ReduceMotion.System,
    });
  }, [clamped, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  const barColor = color ?? tokens.colors.primary;
  const bgColor = trackColor ?? tokens.colors.surfaceAlt;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        {
          height,
          backgroundColor: bgColor,
          borderRadius: tokens.radii.pill,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          animatedStyle,
          {
            backgroundColor: barColor,
            borderRadius: tokens.radii.pill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

