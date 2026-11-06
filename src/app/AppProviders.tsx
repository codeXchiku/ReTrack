import type { ReactNode } from 'react';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/core/theme';
import { ConfirmDialogHost, ToastHost } from '@/core/ui';

export type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Root providers wrapper for the application.
 */
export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        {children}
        <ToastHost />
        <ConfirmDialogHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
