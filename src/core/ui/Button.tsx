import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Interactive button component with smooth 100ms press scale animation and theme variants.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps): React.JSX.Element {
  const { tokens } = useTheme();
  const scale = useSharedValue(1);

  const isInteractive = !disabled && !loading;

  const handlePressIn = () => {
    if (isInteractive) {
      scale.value = withTiming(0.97, {
        duration: 100,
        reduceMotion: ReduceMotion.System,
      });
    }
  };

  const handlePressOut = () => {
    if (isInteractive) {
      scale.value = withTiming(1, {
        duration: 100,
        reduceMotion: ReduceMotion.System,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Resolve colors based on variant
  let bg = tokens.colors.primary;
  let textCol = tokens.colors.onPrimary;

  if (variant === 'secondary') {
    bg = tokens.colors.surfaceAlt;
    textCol = tokens.colors.text;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textCol = tokens.colors.text;
  } else if (variant === 'danger') {
    bg = tokens.colors.danger;
    textCol = '#FFFFFF';
  }

  const height = size === 'lg' ? 56 : 48;
  const paddingHorizontal = size === 'lg' ? tokens.spacing.xl : tokens.spacing.lg;

  return (
    <AnimatedPressable
      onPress={isInteractive ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        animatedStyle,
        {
          backgroundColor: bg,
          height,
          borderRadius: tokens.radii.md,
          paddingHorizontal,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textCol} />
      ) : (
        <Text
          variant={size === 'lg' ? 'heading' : 'body'}
          style={[styles.text, { color: textCol }, textStyle]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

