import React, { useEffect } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
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
import { Text } from './Text';

export type SegmentOption<T extends string = string> = {
  id: T;
  label: string;
};

export type SegmentedControlProps<T extends string = string> = {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Animated 2-4 item segmented control with sliding active indicator.
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedId,
  onSelect,
  style,
  accessibilityLabel = 'Segmented options',
}: SegmentedControlProps<T>): React.JSX.Element {
  const { tokens } = useTheme();
  const selectedIndex = Math.max(
    0,
    options.findIndex(opt => opt.id === selectedId),
  );

  const containerWidth = useSharedValue(0);
  const indicatorOffset = useSharedValue(0);

  const optionCount = Math.max(1, options.length);

  useEffect(() => {
    if (containerWidth.value > 0) {
      const segmentWidth = (containerWidth.value - 8) / optionCount;
      indicatorOffset.value = withTiming(selectedIndex * segmentWidth, {
        duration: 200,
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [selectedIndex, containerWidth, optionCount, indicatorOffset]);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    containerWidth.value = width;
    const segmentWidth = (width - 8) / optionCount;
    indicatorOffset.value = selectedIndex * segmentWidth;
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const segmentWidth =
      containerWidth.value > 0 ? (containerWidth.value - 8) / optionCount : 0;
    return {
      width: segmentWidth,
      transform: [{ translateX: indicatorOffset.value }],
    };
  });

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.surfaceAlt,
          borderRadius: tokens.radii.pill,
          borderColor: tokens.colors.border,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.indicator,
          animatedIndicatorStyle,
          {
            backgroundColor: tokens.colors.primary,
            borderRadius: tokens.radii.pill,
          },
        ]}
      />
      {options.map(opt => {
        const isSelected = opt.id === selectedId;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={opt.label}
            style={styles.segment}
          >
            <Text
              variant="body"
              style={[
                styles.segmentText,
                {
                  color: isSelected
                    ? tokens.colors.onPrimary
                    : tokens.colors.textMuted,
                },
                isSelected ? styles.selectedText : styles.unselectedText,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    padding: 4,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
  },
  segment: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    minHeight: 44,
  },
  segmentText: {
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: '700',
  },
  unselectedText: {
    fontWeight: '500',
  },
});

