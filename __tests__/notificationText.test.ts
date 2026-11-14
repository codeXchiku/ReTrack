import {
  formatMinutesLabel,
  formatPhaseTitle,
  getPausedNotificationTitle,
  getRunningNotificationBody,
  getRunningNotificationTitle,
  getScheduledAlert,
} from '@/features/focus/logic/notificationText';
import type { TimerConfig, TimerState } from '@/features/focus/logic/types';

function createMockState(overrides: Partial<TimerState> = {}): TimerState {
  const config: TimerConfig = {
    mode: 'pomodoro',
    subjectId: null,
    focusMs: 25 * 60 * 1000,
    breakMs: 5 * 60 * 1000,
    longBreakMs: 15 * 60 * 1000,
    rounds: 4,
    silence: true,
    keepAwake: true,
  };

  return {
    sessionId: 'test-session',
    config,
    status: 'running',
    phase: 'focus',
    round: 1,
    phaseDurationMs: 25 * 60 * 1000,
    segmentStartedAt: 1000,
    elapsedBeforeMs: 0,
    focusedMsDone: 0,
    startedAt: 1000,
    endedAt: null,
    completed: false,
    ...overrides,
  };
}

describe('notificationText pure logic', () => {
  describe('formatPhaseTitle', () => {
    it('capitalizes phase names correctly', () => {
      expect(formatPhaseTitle('focus')).toBe('Focus');
      expect(formatPhaseTitle('break')).toBe('Break');
      expect(formatPhaseTitle('longBreak')).toBe('Long break');
    });
  });

  describe('getRunningNotificationTitle', () => {
    it('includes subject name when provided', () => {
      expect(getRunningNotificationTitle('focus', 'Physics')).toBe('Focus - Physics');
      expect(getRunningNotificationTitle('break', 'Calculus')).toBe('Break - Calculus');
      expect(getRunningNotificationTitle('longBreak', 'History')).toBe('Long break - History');
    });

    it('defaults to Study when subject name is missing or empty', () => {
      expect(getRunningNotificationTitle('focus', null)).toBe('Focus - Study');
      expect(getRunningNotificationTitle('focus', undefined)).toBe('Focus - Study');
      expect(getRunningNotificationTitle('focus', '')).toBe('Focus - Study');
      expect(getRunningNotificationTitle('focus', '   ')).toBe('Focus - Study');
    });
  });

  describe('getRunningNotificationBody', () => {
    it('returns "Round X of Y" for pomodoro mode', () => {
      const state = createMockState({ round: 2 });
      expect(getRunningNotificationBody(state)).toBe('Round 2 of 4');
    });

    it('returns "Stay focused" for countdown mode', () => {
      const state = createMockState({
        config: {
          mode: 'countdown',
          subjectId: null,
          focusMs: 30 * 60 * 1000,
          breakMs: 0,
          longBreakMs: 0,
          rounds: 1,
          silence: false,
          keepAwake: false,
        },
      });
      expect(getRunningNotificationBody(state)).toBe('Stay focused');
    });

    it('returns "Stay focused" for stopwatch mode', () => {
      const state = createMockState({
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
      });
      expect(getRunningNotificationBody(state)).toBe('Stay focused');
    });
  });

  describe('getPausedNotificationTitle', () => {
    it('appends Paused to running notification title', () => {
      expect(getPausedNotificationTitle('focus', 'Physics')).toBe('Focus - Physics - Paused');
      expect(getPausedNotificationTitle('break', null)).toBe('Break - Study - Paused');
    });
  });

  describe('formatMinutesLabel', () => {
    it('formats singular 1 min', () => {
      expect(formatMinutesLabel(60 * 1000)).toBe('1 min');
    });

    it('formats plural minutes', () => {
      expect(formatMinutesLabel(5 * 60 * 1000)).toBe('5 min');
      expect(formatMinutesLabel(15 * 60 * 1000)).toBe('15 min');
      expect(formatMinutesLabel(30 * 60 * 1000)).toBe('30 min');
    });

    it('rounds sub-minute durations to minimum 1 min', () => {
      expect(formatMinutesLabel(10 * 1000)).toBe('1 min');
    });
  });

  describe('getScheduledAlert', () => {
    describe('Stopwatch mode', () => {
      it('returns null because stopwatch has no predetermined endsAt', () => {
        const state = createMockState({
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
        });
        expect(getScheduledAlert(state, 'Math')).toBeNull();
      });
    });

    describe('Countdown mode', () => {
      it('returns session complete alert with subject', () => {
        const state = createMockState({
          config: {
            mode: 'countdown',
            subjectId: 'subj-1',
            focusMs: 30 * 60 * 1000,
            breakMs: 0,
            longBreakMs: 0,
            rounds: 1,
            silence: false,
            keepAwake: false,
          },
        });
        const alert = getScheduledAlert(state, 'Physics');
        expect(alert).toEqual({
          title: 'Session complete',
          body: 'Session complete - 30m of Physics',
        });
      });

      it('returns session complete alert without subject', () => {
        const state = createMockState({
          config: {
            mode: 'countdown',
            subjectId: null,
            focusMs: 45 * 60 * 1000,
            breakMs: 0,
            longBreakMs: 0,
            rounds: 1,
            silence: false,
            keepAwake: false,
          },
        });
        const alert = getScheduledAlert(state, null);
        expect(alert).toEqual({
          title: 'Session complete',
          body: 'Session complete - 45m',
        });
      });
    });

    describe('Pomodoro mode transitions', () => {
      it('transition 1: focus -> break (e.g. round 2 of 4 with 5m break)', () => {
        const state = createMockState({
          round: 2,
          phase: 'focus',
          config: {
            mode: 'pomodoro',
            subjectId: 'subj-1',
            focusMs: 25 * 60 * 1000,
            breakMs: 5 * 60 * 1000,
            longBreakMs: 15 * 60 * 1000,
            rounds: 4,
            silence: true,
            keepAwake: true,
          },
        });
        const alert = getScheduledAlert(state, 'Biology');
        expect(alert).toEqual({
          title: 'Break time',
          body: 'Round 2 done - take a 5 min break',
        });
      });

      it('handles singular 1 min break for short break', () => {
        const state = createMockState({
          round: 1,
          phase: 'focus',
          config: {
            mode: 'pomodoro',
            subjectId: null,
            focusMs: 15 * 60 * 1000,
            breakMs: 1 * 60 * 1000,
            longBreakMs: 5 * 60 * 1000,
            rounds: 3,
            silence: false,
            keepAwake: false,
          },
        });
        const alert = getScheduledAlert(state, null);
        expect(alert).toEqual({
          title: 'Break time',
          body: 'Round 1 done - take a 1 min break',
        });
      });

      it('transition 2: break -> awaitingNext (e.g. round 2 break ends)', () => {
        const state = createMockState({
          round: 2,
          phase: 'break',
        });
        const alert = getScheduledAlert(state, 'Chemistry');
        expect(alert).toEqual({
          title: 'Break over',
          body: 'Break over - ready for round 3?',
        });
      });

      it('transition 3: last focus -> long break (e.g. round 4 of 4)', () => {
        const state = createMockState({
          round: 4,
          phase: 'focus',
          config: {
            mode: 'pomodoro',
            subjectId: 'subj-1',
            focusMs: 25 * 60 * 1000,
            breakMs: 5 * 60 * 1000,
            longBreakMs: 15 * 60 * 1000,
            rounds: 4,
            silence: true,
            keepAwake: true,
          },
        });
        const alert = getScheduledAlert(state, 'Physics');
        expect(alert).toEqual({
          title: 'Long break time',
          body: 'Round 4 done - take a 15 min long break',
        });
      });

      it('handles singular 1 min long break', () => {
        const state = createMockState({
          round: 2,
          phase: 'focus',
          config: {
            mode: 'pomodoro',
            subjectId: null,
            focusMs: 10 * 60 * 1000,
            breakMs: 2 * 60 * 1000,
            longBreakMs: 1 * 60 * 1000,
            rounds: 2,
            silence: false,
            keepAwake: false,
          },
        });
        const alert = getScheduledAlert(state, null);
        expect(alert).toEqual({
          title: 'Long break time',
          body: 'Round 2 done - take a 1 min long break',
        });
      });

      it('transition 4: long break -> finish (with subject)', () => {
        const state = createMockState({
          round: 4,
          phase: 'longBreak',
          config: {
            mode: 'pomodoro',
            subjectId: 'subj-1',
            focusMs: 25 * 60 * 1000,
            breakMs: 5 * 60 * 1000,
            longBreakMs: 15 * 60 * 1000,
            rounds: 4,
            silence: true,
            keepAwake: true,
          },
        });
        // 4 rounds * 25m = 100m = 1h 40m
        const alert = getScheduledAlert(state, 'Physics');
        expect(alert).toEqual({
          title: 'Session complete',
          body: 'Session complete - 1h 40m of Physics',
        });
      });

      it('transition 4: long break -> finish (without subject)', () => {
        const state = createMockState({
          round: 4,
          phase: 'longBreak',
          config: {
            mode: 'pomodoro',
            subjectId: null,
            focusMs: 25 * 60 * 1000,
            breakMs: 5 * 60 * 1000,
            longBreakMs: 15 * 60 * 1000,
            rounds: 4,
            silence: true,
            keepAwake: true,
          },
        });
        const alert = getScheduledAlert(state, null);
        expect(alert).toEqual({
          title: 'Session complete',
          body: 'Session complete - 1h 40m',
        });
      });
    });
  });
});
