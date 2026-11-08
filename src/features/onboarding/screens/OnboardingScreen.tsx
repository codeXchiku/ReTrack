import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { getSlotItems } from '@/core/registry';
import { useTheme } from '@/core/theme';
import { Screen } from '@/core/ui';
import { onboardingDone } from '../data/onboardingKeys';

const SLIDE_DURATION = 250;

/**
 * Onboarding screen displaying registered onboarding steps sequentially.
 */
export function OnboardingScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const steps = getSlotItems('onboarding.steps');

  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimating = useRef(false);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const updateIndex = useCallback((targetIndex: number) => {
    setCurrentIndex(targetIndex);
    isAnimating.current = false;
  }, []);

  const finishOnboarding = useCallback(() => {
    onboardingDone.set(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs' as never }],
    });
  }, [navigation]);

  const goToIndex = useCallback(
    (targetIndex: number, direction: 'forward' | 'backward') => {
      if (isAnimating.current) {
        return;
      }
      isAnimating.current = true;
      const exitOffset = direction === 'forward' ? -40 : 40;
      const enterOffset = direction === 'forward' ? 40 : -40;

      // Animate out
      opacity.value = withTiming(0, {
        duration: SLIDE_DURATION / 2,
        reduceMotion: ReduceMotion.System,
      });
      translateX.value = withTiming(
        exitOffset,
        {
          duration: SLIDE_DURATION / 2,
          reduceMotion: ReduceMotion.System,
        },
        finished => {
          if (finished) {
            // Prepare entering position
            translateX.value = enterOffset;
            // React state update via JS thread
            runOnJS(updateIndex)(targetIndex);
            // Animate in
            opacity.value = withTiming(1, {
              duration: SLIDE_DURATION / 2,
              reduceMotion: ReduceMotion.System,
            });
            translateX.value = withTiming(0, {
              duration: SLIDE_DURATION / 2,
              reduceMotion: ReduceMotion.System,
            });
          }
        },
      );
    },
    [opacity, translateX, updateIndex],
  );

  // Handle hardware back press on Android
  useEffect(() => {
    const onBackPress = () => {
      if (currentIndex > 0) {
        goToIndex(currentIndex - 1, 'backward');
        return true;
      }
      // On the first step, do nothing / prevent exiting app
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => subscription.remove();
  }, [currentIndex, goToIndex]);

  const handleNext = () => {
    if (currentIndex >= steps.length - 1) {
      finishOnboarding();
    } else {
      goToIndex(currentIndex + 1, 'forward');
    }
  };

  const handleSkip = () => {
    if (currentIndex >= steps.length - 1) {
      finishOnboarding();
    } else {
      goToIndex(currentIndex + 1, 'forward');
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const currentStep = steps[currentIndex];
  const StepComponent = currentStep?.component;
  const isLast = currentIndex === steps.length - 1;

  return (
    <Screen style={styles.screen} accessibilityLabel="Onboarding Screen">
      {/* Top Dots Indicator */}
      {steps.length > 1 ? (
        <View style={[styles.dotsContainer, { marginVertical: tokens.spacing.md }]}>
          {steps.map((step, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={step.id}
                style={[
                  styles.dot,
                  isActive ? styles.activeDot : styles.inactiveDot,
                  {
                    backgroundColor: isActive
                      ? tokens.colors.primary
                      : tokens.colors.border,
                  },
                ]}
                accessibilityLabel={`Step ${idx + 1} of ${steps.length}`}
              />
            );
          })}
        </View>
      ) : null}

      {/* Step View */}
      <Animated.View style={[styles.stepContainer, animatedStyle]}>
        {StepComponent ? (
          <StepComponent
            onContinue={handleNext}
            onSkip={handleSkip}
            isLast={isLast}
          />
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 20,
  },
  inactiveDot: {
    width: 8,
  },
  stepContainer: {
    flex: 1,
  },
});
