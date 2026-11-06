import React, { useEffect } from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';

export type ToggleProps = {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_OFFSET = 3;
const TRAVEL_DISTANCE = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;

/**
 * Accessible, animated switch toggle with a 44dp minimum touch area.
 */
export function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel = 'Toggle setting',
  style,
}: ToggleProps): React.JSX.Element {
  const { tokens } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: 150,
      reduceMotion: ReduceMotion.System,
    });
  }, [value, progress]);

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [tokens.colors.surfaceAlt, tokens.colors.primary],
    );
    return { backgroundColor };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: progress.value * TRAVEL_DISTANCE }],
    };
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.touchTarget, style]}
    >
      <Animated.View
        style={[
          styles.track,
          animatedTrackStyle,
          {
            borderRadius: tokens.radii.pill,
          },
          disabled && styles.disabled,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            animatedThumbStyle,
            {
              backgroundColor: value
                ? tokens.colors.onPrimary
                : tokens.colors.text,
              borderRadius: tokens.radii.pill,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    minWidth: 48,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    padding: THUMB_OFFSET,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  disabled: {
    opacity: 0.5,
  },
});

