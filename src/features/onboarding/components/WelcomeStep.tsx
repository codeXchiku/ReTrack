import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/core/theme';
import { Button, Text } from '@/core/ui';
import type { OnboardingStepProps } from './OnboardingStepLayout';

const BULLETS = [
  'Focus timers that keep you on track',
  'Flashcards that schedule themselves',
  'Your phone goes quiet while you study. 100% offline.',
];

/**
 * Welcome step of the onboarding flow.
 */
export function WelcomeStep({
  onContinue,
}: OnboardingStepProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <View
      style={[styles.container, { paddingHorizontal: tokens.spacing.lg }]}
      accessibilityLabel="Onboarding Welcome Step"
    >
      <View style={styles.content}>
        {/* SVG Hero */}
        <View style={[styles.heroContainer, { marginBottom: tokens.spacing.xl }]}>
          <Svg width={100} height={100} viewBox="0 0 100 100">
            <Circle
              cx={50}
              cy={50}
              r={46}
              fill="none"
              stroke={tokens.colors.primary}
              strokeWidth={3}
              opacity={0.3}
            />
            <Circle
              cx={50}
              cy={50}
              r={36}
              fill={tokens.colors.surface}
              stroke={tokens.colors.primary}
              strokeWidth={2}
            />
            {/* Dojo / Torii gate symbol */}
            <Path
              d="M30 40 H70 M34 40 V66 M66 40 V66 M26 34 Q50 30 74 34"
              stroke={tokens.colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>

        {/* App Title */}
        <Text variant="display" color="primary" style={styles.appName}>
          Study Dojo
        </Text>
        <Text
          variant="body"
          color="textMuted"
          style={[styles.tagline, { marginTop: tokens.spacing.xs }]}
        >
          Master your exams with calm, distraction-free focus.
        </Text>

        {/* 3 Bullets */}
        <View style={[styles.bulletsList, { marginTop: tokens.spacing.xl, gap: tokens.spacing.md }]}>
          {BULLETS.map(bullet => (
            <View key={bullet} style={[styles.bulletRow, { gap: tokens.spacing.sm }]}>
              <View
                style={[
                  styles.bulletDot,
                  styles.bulletDotOffset,
                  { backgroundColor: tokens.colors.primary },
                ]}
              />
              <Text variant="body" color="text" style={styles.bulletText}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: tokens.spacing.xl }]}>
        <Button
          title="Get started"
          variant="primary"
          onPress={onContinue}
          accessibilityLabel="Get started"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    alignItems: 'center',
  },
  appName: {
    textAlign: 'center',
    fontWeight: '700',
  },
  tagline: {
    textAlign: 'center',
  },
  bulletsList: {
    width: '100%',
    paddingHorizontal: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletDotOffset: {
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    width: '100%',
  },
});
