/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from '@/app/App';
import { name as appName } from './app.json';

// Register foreground service task that stays alive until stopped
notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Kept alive until notifee.stopForegroundService() is called
  });
});

AppRegistry.registerComponent(appName, () => App);
