import React, { type ReactNode, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const DISMISS_THRESHOLD = 120;

/**
 * Modal-less bottom sheet with dimmed backdrop, drag-down dismissal, and keyboard avoidance.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  style,
  accessibilityLabel = 'Bottom sheet',
}: BottomSheetProps): React.JSX.Element | null {
  const { tokens } = useTheme();
  const [isRendered, setIsRendered] = useState(visible);

  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      translateY.value = withTiming(0, {
        duration: 250,
        reduceMotion: ReduceMotion.System,
      });
      backdropOpacity.value = withTiming(1, {
        duration: 250,
        reduceMotion: ReduceMotion.System,
      });
    } else if (isRendered) {
      backdropOpacity.value = withTiming(0, {
        duration: 200,
        reduceMotion: ReduceMotion.System,
      });
      translateY.value = withTiming(
        600,
        {
          duration: 200,
          reduceMotion: ReduceMotion.System,
        },
        finished => {
          if (finished) {
            runOnJS(setIsRendered)(false);
          }
        },
      );
    }
  }, [visible, isRendered, translateY, backdropOpacity]);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 600) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, {
          duration: 200,
          reduceMotion: ReduceMotion.System,
        });
      }
    });

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isRendered) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isRendered}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Dimmed backdrop */}
        <Animated.View
          style={[styles.backdrop, animatedBackdropStyle]}
          pointerEvents="auto"
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss bottom sheet"
          />
        </Animated.View>

        {/* Sheet content wrapped in KeyboardAvoidingView */}
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardContainer}
          pointerEvents="box-none"
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View
              accessibilityLabel={accessibilityLabel}
              style={[
                styles.sheet,
                animatedSheetStyle,
                {
                  backgroundColor: tokens.colors.surface,
                  borderTopLeftRadius: tokens.radii.lg,
                  borderTopRightRadius: tokens.radii.lg,
                  borderColor: tokens.colors.border,
                },
                style,
              ]}
            >
              {/* Grab handle */}
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: tokens.colors.surfaceAlt },
                  ]}
                />
              </View>
              {children}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 100,
  },
  keyboardContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 101,
  },
  sheet: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  handleContainer: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
});
