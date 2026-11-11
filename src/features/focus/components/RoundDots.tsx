import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { spacing, useTheme } from '@/core/theme';
import {
  type RoundDotState,
  computeRoundDots,
} from '../logic/labels';
import type { Phase, TimerStatus } from '../logic/types';

export type RoundDotsProps = {
  totalRounds: number;
  currentRound?: number;
  phase?: Phase;
  status?: TimerStatus;
  dots?: RoundDotState[];
  color?: string;
};

/**
 * Visual indicator of Pomodoro rounds displaying filled, active, and pending dots.
 */
export function RoundDots({
  totalRounds,
  currentRound = 1,
  phase = 'focus',
  status = 'running',
  dots: customDots,
  color,
}: RoundDotsProps): React.JSX.Element {
  const { tokens } = useTheme();

  const dots =
    customDots ??
    computeRoundDots(totalRounds, currentRound, phase, status);

  const activeColor = color ?? tokens.colors.focus;
  const filledColor = color ?? tokens.colors.focus;
  const inactiveBorder = tokens.colors.border;
  const inactiveBg = tokens.colors.surface;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Round progress: ${currentRound} of ${totalRounds}`}
    >
      {dots.map(dot => {
        let dotStyle: StyleProp<ViewStyle> = [
          styles.dot,
          {
            backgroundColor: inactiveBg,
            borderColor: inactiveBorder,
          },
        ];

        if (dot.filled) {
          dotStyle = [
            styles.dot,
            {
              backgroundColor: filledColor,
              borderColor: filledColor,
            },
          ];
        } else if (dot.active) {
          dotStyle = [
            styles.dot,
            styles.activeDot,
            {
              backgroundColor: activeColor,
              borderColor: activeColor,
            },
          ];
        }

        return <View key={dot.index} style={dotStyle} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  activeDot: {
    transform: [{ scale: 1.2 }],
  },
});
