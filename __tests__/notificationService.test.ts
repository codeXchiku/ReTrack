import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  type NotificationSettings,
  TriggerType,
} from '@notifee/react-native';
import { eventBus } from '@/core/events';
import { soundEnabledSetting } from '@/core/prefs';
import { showToast } from '@/core/ui';
import {
  ALERT_NOTIFICATION_ID,
  destroyNotificationService,
  ensureNotificationPermission,
  initNotificationService,
  resetPermissionToastFlag,
  RUNNING_CHANNEL_ID,
  RUNNING_NOTIFICATION_ID,
  SESSION_END_CHANNEL_ID,
  SESSION_END_SILENT_CHANNEL_ID,
} from '@/features/focus/services/notificationService';
import { focusController } from '@/features/focus/services/focusController';
import type { TimerState } from '@/features/focus/logic/types';

jest.mock('@/core/ui', () => ({
  ...jest.requireActual('@/core/ui'),
  showToast: jest.fn(),
}));

jest.mock('@/features/subjects', () => ({
  getSubjectSync: jest.fn((id: string) =>
    id === 'subj-physics' ? { id: 'subj-physics', name: 'Physics', color: '#FF0000' } : null,
  ),
}));

const flushPromises = () =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), 0);
  });

describe('notificationService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    resetPermissionToastFlag();
    destroyNotificationService();
    soundEnabledSetting.set(true);
  });

  afterEach(() => {
    destroyNotificationService();
  });

  describe('channel creation', () => {
    it('creates running, session-end, and session-end-silent channels', async () => {
      await initNotificationService();

      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: RUNNING_CHANNEL_ID,
          name: 'Running session',
          importance: AndroidImportance.LOW,
          vibration: false,
        }),
      );

      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: SESSION_END_CHANNEL_ID,
          name: 'Session alerts',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          bypassDnd: true,
        }),
      );

      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: SESSION_END_SILENT_CHANNEL_ID,
          name: 'Session alerts (silent)',
          importance: AndroidImportance.HIGH,
          vibration: true,
          bypassDnd: true,
        }),
      );
    });
  });

  describe('phaseStarted and resumed events', () => {
    it('displays ongoing notification and schedules trigger alert on phaseStarted', async () => {
      await initNotificationService();

      const endsAt = Date.now() + 25 * 60 * 1000;
      const mockState: TimerState = {
        sessionId: 'sess-1',
        config: {
          mode: 'pomodoro',
          subjectId: 'subj-physics',
          focusMs: 25 * 60 * 1000,
          breakMs: 5 * 60 * 1000,
          longBreakMs: 15 * 60 * 1000,
          rounds: 4,
          silence: true,
          keepAwake: true,
        },
        status: 'running',
        phase: 'focus',
        round: 1,
        phaseDurationMs: 25 * 60 * 1000,
        segmentStartedAt: Date.now(),
        elapsedBeforeMs: 0,
        focusedMsDone: 0,
        startedAt: Date.now(),
        endedAt: null,
        completed: false,
      };

      jest.spyOn(focusController, 'getActive').mockReturnValue(mockState);

      eventBus.emit('focus/phaseStarted', {
        sessionId: 'sess-1',
        phase: 'focus',
        endsAt,
        silence: true,
      });

      // Allow microtasks to complete
      await flushPromises();

      // Verify ongoing notification
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: RUNNING_NOTIFICATION_ID,
          title: 'Focus - Physics',
          body: 'Round 1 of 4',
          android: expect.objectContaining({
            channelId: RUNNING_CHANNEL_ID,
            asForegroundService: true,
            ongoing: true,
            showChronometer: true,
            chronometerDirection: 'down',
            timestamp: endsAt,
            smallIcon: 'ic_notification',
          }),
        }),
      );

      // Verify trigger notification scheduled
      expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith(ALERT_NOTIFICATION_ID);
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ALERT_NOTIFICATION_ID,
          title: 'Break time',
          body: 'Round 1 done - take a 5 min break',
          android: expect.objectContaining({
            channelId: SESSION_END_CHANNEL_ID,
            smallIcon: 'ic_notification',
          }),
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
          timestamp: endsAt,
          alarmManager: { allowWhileIdle: true },
        }),
      );
    });

    it('uses silent channel when soundEnabled is false', async () => {
      soundEnabledSetting.set(false);
      await initNotificationService();

      const endsAt = Date.now() + 10 * 60 * 1000;
      const mockState: TimerState = {
        sessionId: 'sess-2',
        config: {
          mode: 'countdown',
          subjectId: null,
          focusMs: 10 * 60 * 1000,
          breakMs: 0,
          longBreakMs: 0,
          rounds: 1,
          silence: false,
          keepAwake: false,
        },
        status: 'running',
        phase: 'focus',
        round: 1,
        phaseDurationMs: 10 * 60 * 1000,
        segmentStartedAt: Date.now(),
        elapsedBeforeMs: 0,
        focusedMsDone: 0,
        startedAt: Date.now(),
        endedAt: null,
        completed: false,
      };

      jest.spyOn(focusController, 'getActive').mockReturnValue(mockState);

      eventBus.emit('focus/resumed', {
        sessionId: 'sess-2',
        phase: 'focus',
        endsAt,
        silence: false,
      });

      await flushPromises();

      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            channelId: SESSION_END_SILENT_CHANNEL_ID,
          }),
        }),
        expect.anything(),
      );
    });

    it('supports stopwatch mode with counting up chronometer and no alert trigger', async () => {
      await initNotificationService();

      const now = Date.now();
      const mockState: TimerState = {
        sessionId: 'sess-stopwatch',
        config: {
          mode: 'stopwatch',
          subjectId: null,
          focusMs: 0,
          breakMs: 0,
          longBreakMs: 0,
          rounds: 1,
          silence: false,
          keepAwake: false,
        },
        status: 'running',
        phase: 'focus',
        round: 1,
        phaseDurationMs: null,
        segmentStartedAt: now - 30000,
        elapsedBeforeMs: 30000,
        focusedMsDone: 0,
        startedAt: now - 60000,
        endedAt: null,
        completed: false,
      };

      jest.spyOn(focusController, 'getActive').mockReturnValue(mockState);

      eventBus.emit('focus/phaseStarted', {
        sessionId: 'sess-stopwatch',
        phase: 'focus',
        endsAt: null,
        silence: false,
      });

      await flushPromises();

      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            chronometerDirection: 'up',
            showChronometer: true,
          }),
        }),
      );

      // No trigger notification scheduled for stopwatch
      expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    });
  });

  describe('paused event', () => {
    it('cancels alert and updates ongoing notification to Paused', async () => {
      await initNotificationService();

      const mockState: TimerState = {
        sessionId: 'sess-paused',
        config: {
          mode: 'countdown',
          subjectId: 'subj-physics',
          focusMs: 30 * 60 * 1000,
          breakMs: 0,
          longBreakMs: 0,
          rounds: 1,
          silence: false,
          keepAwake: false,
        },
        status: 'paused',
        phase: 'focus',
        round: 1,
        phaseDurationMs: 30 * 60 * 1000,
        segmentStartedAt: null,
        elapsedBeforeMs: 5000,
        focusedMsDone: 0,
        startedAt: Date.now() - 5000,
        endedAt: null,
        completed: false,
      };

      jest.spyOn(focusController, 'getActive').mockReturnValue(mockState);

      eventBus.emit('focus/paused', { sessionId: 'sess-paused' });

      await flushPromises();

      expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith(ALERT_NOTIFICATION_ID);
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: RUNNING_NOTIFICATION_ID,
          title: 'Focus - Physics - Paused',
          body: 'Paused',
          android: expect.objectContaining({
            showChronometer: false,
            ongoing: true,
          }),
        }),
      );
    });
  });

  describe('awaitingNext, stopped, finished events', () => {
    it('awaitingNext stops foreground service and cancels ongoing notification without cancelling trigger', async () => {
      await initNotificationService();

      eventBus.emit('focus/awaitingNext', {
        sessionId: 'sess-awaiting',
        nextRound: 2,
      });

      await flushPromises();

      expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
      expect(notifee.stopForegroundService).toHaveBeenCalled();
      expect(notifee.cancelNotification).toHaveBeenCalledWith(RUNNING_NOTIFICATION_ID);
    });

    it('stopped cancels trigger, stops foreground service, and cancels ongoing notification', async () => {
      await initNotificationService();

      eventBus.emit('focus/stopped', {
        sessionId: 'sess-stopped',
      });

      await flushPromises();

      expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith(ALERT_NOTIFICATION_ID);
      expect(notifee.stopForegroundService).toHaveBeenCalled();
      expect(notifee.cancelNotification).toHaveBeenCalledWith(RUNNING_NOTIFICATION_ID);
    });

    it('finished stops foreground service and cancels ongoing notification without cancelling trigger', async () => {
      await initNotificationService();

      eventBus.emit('focus/finished', {
        sessionId: 'sess-finished',
        focusedSecs: 1500,
        completed: true,
      });

      await flushPromises();

      expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
      expect(notifee.stopForegroundService).toHaveBeenCalled();
      expect(notifee.cancelNotification).toHaveBeenCalledWith(RUNNING_NOTIFICATION_ID);
    });
  });

  describe('ensureNotificationPermission', () => {
    it('returns true when authorized and does not show toast', async () => {
      jest.spyOn(notifee, 'requestPermission').mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
        android: {},
        ios: {},
        web: {},
      } as unknown as NotificationSettings);

      const result = await ensureNotificationPermission();
      expect(result).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('shows toast once when permission is denied and returns false', async () => {
      jest.spyOn(notifee, 'requestPermission').mockResolvedValue({
        authorizationStatus: AuthorizationStatus.DENIED,
        android: {},
        ios: {},
        web: {},
      } as unknown as NotificationSettings);

      const firstResult = await ensureNotificationPermission();
      expect(firstResult).toBe(false);
      expect(showToast).toHaveBeenCalledTimes(1);
      expect(showToast).toHaveBeenCalledWith(
        'Notifications are off. The timer still works, but you will not be alerted in the background.',
      );

      // Second check should not show toast again
      const secondResult = await ensureNotificationPermission();
      expect(secondResult).toBe(false);
      expect(showToast).toHaveBeenCalledTimes(1);
    });
  });
});
