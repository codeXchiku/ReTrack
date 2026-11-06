import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/core/theme';
import { Text } from '../Text';
import { registerToastListener } from './toastManager';
import type { ToastMessage } from './types';

/**
 * Root host component for displaying toasts.
 */
export function ToastHost(): React.JSX.Element | null {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const unregister = registerToastListener(newToast => {
      setToast(newToast);
      if (newToast) {
        translateY.value = withTiming(0, {
          duration: 200,
          reduceMotion: ReduceMotion.System,
        });
        opacity.value = withTiming(1, {
          duration: 200,
          reduceMotion: ReduceMotion.System,
        });
      } else {
        translateY.value = withTiming(-60, {
          duration: 200,
          reduceMotion: ReduceMotion.System,
        });
        opacity.value = withTiming(0, {
          duration: 200,
          reduceMotion: ReduceMotion.System,
        });
      }
    });

    return unregister;
  }, [translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) {
    return null;
  }

  let bg = tokens.colors.surfaceAlt;
  if (toast.kind === 'success') {
    bg = tokens.colors.success;
  } else if (toast.kind === 'error') {
    bg = tokens.colors.danger;
  }

  return (
    <View
      style={[
        styles.container,
        { top: Math.max(16, insets.top + 8) },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.toastBox,
          animatedStyle,
          {
            backgroundColor: bg,
            borderRadius: tokens.radii.md,
            borderColor: tokens.colors.border,
          },
        ]}
      >
        <Text
          variant="body"
          style={styles.text}
        >
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastBox: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

