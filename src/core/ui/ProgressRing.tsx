import React, { type ReactNode, useEffect } from 'react';
import {
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  type EasingFunction,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/core/theme';

export type ProgressRingProps = {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  duration?: number;
  easing?: EasingFunction;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Circular progress ring with animated SVG stroke and centered content slot.
 */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  trackColor,
  duration = 350,
  easing,
  children,
  style,
  accessibilityLabel = 'Circular progress indicator',
}: ProgressRingProps): React.JSX.Element {
  const { tokens } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const animatedProgress = useSharedValue(clamped);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration,
      easing,
      reduceMotion: ReduceMotion.System,
    });
  }, [clamped, animatedProgress, duration, easing]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const strokeColor = color ?? tokens.colors.primary;
  const bgColor = trackColor ?? tokens.colors.surfaceAlt;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, { width: size, height: size }, style]}
    >
      <Svg width={size} height={size}>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          origin={`${size / 2}, ${size / 2}`}
          rotation="-90"
        />
      </Svg>
      {Boolean(children) && (
        <View style={styles.centerSlot}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerSlot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
