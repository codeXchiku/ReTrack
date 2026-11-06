import React, { type ReactNode } from 'react';
import {
  Text as RNText,
  type StyleProp,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import { type ColorToken, type TypographyToken, useTheme } from '@/core/theme';

export type TextProps = {
  children: ReactNode;
  variant?: TypographyToken;
  color?: ColorToken;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
};

/**
 * Typography component utilizing design system variants and theme color tokens.
 */
export function Text({
  children,
  variant = 'body',
  color = 'text',
  style,
  accessibilityLabel,
  numberOfLines,
  ellipsizeMode,
}: TextProps): React.JSX.Element {
  const { tokens } = useTheme();

  const variantStyle = tokens.typography[variant];
  const textColor = tokens.colors[color];

  return (
    <RNText
      style={[styles.base, variantStyle, { color: textColor }, style]}
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

