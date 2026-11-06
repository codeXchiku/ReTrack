import React, { type ReactNode } from 'react';
import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/core/theme';

export type ScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Screen container with safe-area padding and optional scrolling.
 */
export function Screen({
  children,
  scrollable = false,
  backgroundColor,
  style,
  contentContainerStyle,
  accessibilityLabel = 'Screen content',
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const containerBg = backgroundColor ?? tokens.colors.background;

  const safeStyle: ViewStyle = {
    flex: 1,
    backgroundColor: containerBg,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  if (scrollable) {
    return (
      <View style={safeStyle} accessibilityLabel={accessibilityLabel}>
        <ScrollView
          style={[styles.flex, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[safeStyle, styles.flex, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

