import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  type Notification,
  type TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { eventBus } from '@/core/events';
import { soundEnabledSetting } from '@/core/prefs';
import { showToast } from '@/core/ui';
import { getSubjectSync } from '@/features/subjects';
import {
  getPausedNotificationTitle,
  getRunningNotificationBody,
  getRunningNotificationTitle,
  getScheduledAlert,
} from '../logic/notificationText';
import { getElapsedMs } from '../logic/selectors';
import type { Phase } from '../logic/types';
import { focusController } from './focusController';

export const RUNNING_CHANNEL_ID = 'focus-running';
export const SESSION_END_CHANNEL_ID = 'session-end';
export const SESSION_END_SILENT_CHANNEL_ID = 'session-end-silent';

export const RUNNING_NOTIFICATION_ID = 'focus-running';
export const ALERT_NOTIFICATION_ID = 'focus-alert';

let hasShownPermissionToast = false;
let isInitialized = false;
let unsubscribers: (() => void)[] = [];

/**
 * Resets permission toast warning state (useful for tests).
 */
export function resetPermissionToastFlag(): void {
  hasShownPermissionToast = false;
}

/**
 * Checks and requests notification permission before starting a session.
 * Displays a one-time Toast warning if denied.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    const isGranted =
      settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

    if (!isGranted && !hasShownPermissionToast) {
      hasShownPermissionToast = true;
      showToast(
        'Notifications are off. The timer still works, but you will not be alerted in the background.',
      );
    }
    return isGranted;
  } catch {
    if (!hasShownPermissionToast) {
      hasShownPermissionToast = true;
      showToast(
        'Notifications are off. The timer still works, but you will not be alerted in the background.',
      );
    }
    return false;
  }
}

/**
 * Creates the Android notification channels required for running sessions and alerts.
 */
async function createChannels(): Promise<void> {
  await notifee.createChannel({
    id: RUNNING_CHANNEL_ID,
    name: 'Running session',
    importance: AndroidImportance.LOW,
    vibration: false,
  });

  await notifee.createChannel({
    id: SESSION_END_CHANNEL_ID,
    name: 'Session alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    bypassDnd: true,
  });

  await notifee.createChannel({
    id: SESSION_END_SILENT_CHANNEL_ID,
    name: 'Session alerts (silent)',
    importance: AndroidImportance.HIGH,
    vibration: true,
    bypassDnd: true,
  });
}

/**
 * Starts or updates the foreground-service notification with a live chronometer
 * and schedules the trigger alert notification at endsAt.
 */
async function handlePhaseStartedOrResumed(event: {
  sessionId: string;
  phase: Phase;
  endsAt: number | null;
}): Promise<void> {
  const state = focusController.getActive();
  if (!state) {
    return;
  }

  const subjectName = state.config.subjectId
    ? getSubjectSync(state.config.subjectId)?.name
    : null;

  const isStopwatch = state.config.mode === 'stopwatch';
  const title = getRunningNotificationTitle(state.phase, subjectName);
  const body = getRunningNotificationBody(state);

  // Chronometer base timestamp:
  // For countdown / pomodoro: counts down to endsAt
  // For stopwatch: counts up from starting moment (accounting for elapsed before)
  let chronometerTimestamp: number | undefined;
  if (isStopwatch) {
    const elapsed = getElapsedMs(state, Date.now());
    chronometerTimestamp = Date.now() - elapsed;
  } else if (event.endsAt !== null) {
    chronometerTimestamp = event.endsAt;
  }

  const runningNotification: Notification = {
    id: RUNNING_NOTIFICATION_ID,
    title,
    body,
    android: {
      channelId: RUNNING_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      showChronometer: true,
      chronometerDirection: isStopwatch ? 'up' : 'down',
      timestamp: chronometerTimestamp,
    },
  };

  await notifee.displayNotification(runningNotification);

  // Schedule one trigger alert at endsAt if endsAt exists and is in the future
  if (event.endsAt !== null && event.endsAt > Date.now()) {
    await notifee.cancelTriggerNotification(ALERT_NOTIFICATION_ID);

    const alert = getScheduledAlert(state, subjectName);
    if (alert) {
      const soundEnabled = soundEnabledSetting.get();
      const channelId = soundEnabled
        ? SESSION_END_CHANNEL_ID
        : SESSION_END_SILENT_CHANNEL_ID;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: event.endsAt,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: ALERT_NOTIFICATION_ID,
          title: alert.title,
          body: alert.body,
          android: {
            channelId,
            smallIcon: 'ic_notification',
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
          },
        },
        trigger,
      );
    }
  }
}

/**
 * Updates ongoing notification to "Paused" and cancels any scheduled alert trigger.
 */
async function handlePaused(): Promise<void> {
  await notifee.cancelTriggerNotification(ALERT_NOTIFICATION_ID);

  const state = focusController.getActive();
  if (!state) {
    return;
  }

  const subjectName = state.config.subjectId
    ? getSubjectSync(state.config.subjectId)?.name
    : null;

  const title = getPausedNotificationTitle(state.phase, subjectName);

  await notifee.displayNotification({
    id: RUNNING_NOTIFICATION_ID,
    title,
    body: 'Paused',
    android: {
      channelId: RUNNING_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      showChronometer: false,
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
  });
}

/**
 * Handles awaiting next round: stops foreground service and cancels ongoing notification.
 * Does NOT cancel the scheduled alert trigger so the alert can be delivered.
 */
async function handleAwaitingNext(): Promise<void> {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(RUNNING_NOTIFICATION_ID);
}

/**
 * Handles session stop (stopped early by user): cancels trigger, stops foreground service, cancels ongoing notification.
 */
async function handleStopped(): Promise<void> {
  await notifee.cancelTriggerNotification(ALERT_NOTIFICATION_ID);
  await notifee.stopForegroundService();
  await notifee.cancelNotification(RUNNING_NOTIFICATION_ID);
}

/**
 * Handles session finish (completed naturally): stops foreground service and cancels ongoing notification.
 * Does NOT cancel the scheduled alert trigger so the alarm displays the completion alert.
 */
async function handleFinished(): Promise<void> {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(RUNNING_NOTIFICATION_ID);
}

/**
 * Initializes the notification service: creates channels and attaches event bus listeners.
 */
export async function initNotificationService(): Promise<void> {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    await createChannels();
  } catch {
    // Channel creation failure shouldn't crash app startup
  }

  const u1 = eventBus.on('focus/phaseStarted', handlePhaseStartedOrResumed);
  const u2 = eventBus.on('focus/resumed', handlePhaseStartedOrResumed);
  const u3 = eventBus.on('focus/paused', handlePaused);
  const u4 = eventBus.on('focus/awaitingNext', handleAwaitingNext);
  const u5 = eventBus.on('focus/stopped', handleStopped);
  const u6 = eventBus.on('focus/finished', handleFinished);

  unsubscribers = [u1, u2, u3, u4, u5, u6];
}

/**
 * Tears down notification service listeners (used in testing).
 */
export function destroyNotificationService(): void {
  unsubscribers.forEach(u => u());
  unsubscribers = [];
  isInitialized = false;
}

export const notificationService = {
  init: initNotificationService,
  destroy: destroyNotificationService,
  ensureNotificationPermission,
  resetPermissionToastFlag,
};
