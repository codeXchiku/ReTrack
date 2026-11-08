import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { Button, Text } from '@/core/ui';

export type OnboardingStepProps = {
  onContinue: () => void;
  onSkip: () => void;
  isLast: boolean;
};

export type OnboardingStepLayoutProps = {
  title: string;
  body?: string;
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  accessibilityLabel?: string;
};

/**
 * Standard reusable layout for onboarding steps.
 * Provides a header (title + body), scrollable content area, and action footer.
 */
export function OnboardingStepLayout({
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  accessibilityLabel,
}: OnboardingStepLayoutProps): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: tokens.spacing.lg, paddingBottom: tokens.spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { marginTop: tokens.spacing.lg }]}>
          <Text variant="title" color="text" style={styles.title}>
            {title}
          </Text>
          {body ? (
            <Text
              variant="body"
              color="textMuted"
              style={[styles.body, { marginTop: tokens.spacing.xs }]}
            >
              {body}
            </Text>
          ) : null}
        </View>

        <View style={[styles.content, { marginVertical: tokens.spacing.lg }]}>
          {children}
        </View>

        <View style={[styles.footer, { gap: tokens.spacing.sm }]}>
          <Button
            title={primaryLabel}
            variant="primary"
            onPress={onPrimary}
            disabled={primaryDisabled}
            accessibilityLabel={primaryLabel}
          />
          {secondaryLabel && onSecondary ? (
            <Button
              title={secondaryLabel}
              variant="ghost"
              onPress={onSecondary}
              accessibilityLabel={secondaryLabel}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    width: '100%',
  },
});
