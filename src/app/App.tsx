import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { darkPalette, spacing } from '@/core/theme';
import { Button, Screen, Text } from '@/core/ui';
import { UiGallery } from '@/dev/UiGallery';
import { AppProviders } from './AppProviders';
import { bootstrap } from './bootstrap';

type BootstrapState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

function AppContent(): React.JSX.Element {
  const [state, setState] = useState<BootstrapState>({ status: 'loading' });

  const runBootstrap = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      await bootstrap();
      setState({ status: 'ready' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    runBootstrap();
  }, [runBootstrap]);

  if (state.status === 'loading') {
    return (
      <View
        style={styles.splashContainer}
        accessibilityLabel="Loading Study Dojo"
      >
        <Text variant="title" color="text">
          Study Dojo
        </Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text variant="title" color="danger" style={styles.errorTitle}>
            Startup Failed
          </Text>
          <Text variant="body" color="textMuted" style={styles.errorMessage}>
            {state.message}
          </Text>
          <Button
            title="Try again"
            variant="primary"
            onPress={runBootstrap}
            accessibilityLabel="Try again"
          />
        </View>
      </Screen>
    );
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return <UiGallery />;
  }

  return (
    <Screen style={styles.mainContainer}>
      <Text variant="title" color="text">
        Study Dojo
      </Text>
    </Screen>
  );
}

export function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkPalette.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  errorContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  errorTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
