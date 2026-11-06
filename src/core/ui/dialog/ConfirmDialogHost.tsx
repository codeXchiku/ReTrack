import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';
import { Button } from '../Button';
import { Card } from '../Card';
import { Text } from '../Text';
import { registerDialogListener } from './dialogManager';
import type { DialogState } from './types';

/**
 * Root host for confirmation dialogs.
 */
export function ConfirmDialogHost(): React.JSX.Element | null {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { tokens } = useTheme();

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const unregister = registerDialogListener(newDialog => {
      setDialog(newDialog);
      if (newDialog) {
        scale.value = withTiming(1, {
          duration: 180,
          reduceMotion: ReduceMotion.System,
        });
        opacity.value = withTiming(1, {
          duration: 180,
          reduceMotion: ReduceMotion.System,
        });
      } else {
        scale.value = withTiming(0.9, {
          duration: 150,
          reduceMotion: ReduceMotion.System,
        });
        opacity.value = withTiming(0, {
          duration: 150,
          reduceMotion: ReduceMotion.System,
        });
      }
    });

    return unregister;
  }, [scale, opacity]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!dialog) {
    return null;
  }

  const handleCancel = () => {
    dialog.resolve(false);
  };

  const handleConfirm = () => {
    dialog.resolve(true);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss confirmation dialog"
        />
      </Animated.View>

      {/* Dialog box */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <Animated.View style={[styles.dialogCardWrapper, animatedCardStyle]}>
          <Card style={styles.card}>
            <Text variant="title" style={styles.title}>
              {dialog.title}
            </Text>
            <Text
              variant="body"
              style={[styles.message, { color: tokens.colors.textMuted }]}
            >
              {dialog.message}
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title={dialog.cancelLabel ?? 'Cancel'}
                variant="ghost"
                onPress={handleCancel}
                style={styles.actionBtn}
              />
              <Button
                title={dialog.confirmLabel ?? 'Confirm'}
                variant={dialog.destructive ? 'danger' : 'primary'}
                onPress={handleConfirm}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9000,
  },
  centerContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9001,
  },
  dialogCardWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    minWidth: 100,
  },
});
