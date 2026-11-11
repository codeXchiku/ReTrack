import React, { useState } from 'react';
import {
  type KeyboardTypeOptions,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

export type TextFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Text input field with label, error states, and optional character counter.
 */
export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  error,
  maxLength,
  keyboardType,
  accessibilityLabel,
  autoFocus,
  secureTextEntry,
  style,
  inputStyle,
}: TextFieldProps): React.JSX.Element {
  const { tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  let borderColor = tokens.colors.border;
  if (hasError) {
    borderColor = tokens.colors.danger;
  } else if (isFocused) {
    borderColor = tokens.colors.primary;
  }

  return (
    <View style={[styles.wrapper, style]}>
      {Boolean(label) && (
        <Text
          variant="caption"
          style={[styles.label, { color: tokens.colors.textMuted }]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          multiline ? styles.multilineContainer : styles.singlelineContainer,
          {
            backgroundColor: tokens.colors.surface,
            borderColor,
            borderRadius: tokens.radii.md,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          style={[
            styles.input,
            {
              color: tokens.colors.text,
              fontSize: tokens.typography.body.fontSize,
            },
            inputStyle,
          ]}
        />
      </View>
      <View style={styles.footer}>
        {hasError ? (
          <Text
            variant="caption"
            style={[styles.errorText, { color: tokens.colors.danger }]}
          >
            {error}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {maxLength !== undefined && (
          <Text
            variant="caption"
            style={[styles.counter, { color: tokens.colors.textMuted }]}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 8,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  inputContainer: {
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  singlelineContainer: {
    minHeight: 48,
  },
  multilineContainer: {
    minHeight: 88,
  },
  input: {
    paddingVertical: 10,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    minHeight: 18,
  },
  errorText: {
    flex: 1,
  },
  counter: {
    marginLeft: 8,
  },
  flex: {
    flex: 1,
  },
});

