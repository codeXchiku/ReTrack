import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UiGallery } from '@/dev/UiGallery';
import { AppProviders } from './AppProviders';
import { bootstrap } from './bootstrap';

bootstrap();

export function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProviders>
        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <UiGallery />
        ) : (
          <View style={styles.container}>
            <Text style={styles.text}>Study Dojo</Text>
          </View>
        )}
      </AppProviders>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});

export default App;
