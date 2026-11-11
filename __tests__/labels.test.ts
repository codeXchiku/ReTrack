import {
  awaitingNextTitle,
  computeRoundDots,
  nextActionLabel,
  phaseTitle,
  phaseTitleFromPhase,
  pomodoroFinishedSubtitle,
  pomodoroStoppedEarlyText,
  roundLabel,
} from '@/features/focus/logic/labels';
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

describe('labels pure logic', () => {
  describe('roundLabel', () => {
    it('returns "Round x / y" for pomodoro mode', () => {
      const state = createMockState({ round: 2 });
      expect(roundLabel(state)).toBe('Round 2 / 4');
    });

    it('returns "Round 4 / 4" for the last round', () => {
      const state = createMockState({ round: 4 });
      expect(roundLabel(state)).toBe('Round 4 / 4');
    });

    it('returns empty string for non-pomodoro mode', () => {
      const state = createMockState({
        config: {
          mode: 'countdown',
          subjectId: null,
          focusMs: 15 * 60 * 1000,
          breakMs: 0,
          longBreakMs: 0,
          rounds: 1,
          silence: false,
          keepAwake: false,
        },
      });
      expect(roundLabel(state)).toBe('');
    });
  });

  describe('phaseTitle', () => {
    it('returns "FOCUS" for focus phase', () => {
      const state = createMockState({ phase: 'focus' });
      expect(phaseTitle(state)).toBe('FOCUS');
    });

    it('returns "BREAK" for short break phase', () => {
      const state = createMockState({ phase: 'break' });
      expect(phaseTitle(state)).toBe('BREAK');
    });

    it('returns "LONG BREAK" for long break phase', () => {
      const state = createMockState({ phase: 'longBreak' });
      expect(phaseTitle(state)).toBe('LONG BREAK');
    });

    it('handles phaseTitleFromPhase directly', () => {
      expect(phaseTitleFromPhase('focus')).toBe('FOCUS');
      expect(phaseTitleFromPhase('break')).toBe('BREAK');
      expect(phaseTitleFromPhase('longBreak')).toBe('LONG BREAK');
    });
  });

  describe('nextActionLabel', () => {
    it('returns "Start round N+1" when status is awaitingNext', () => {
      const state = createMockState({
        status: 'awaitingNext',
        round: 2,
      });
      expect(nextActionLabel(state)).toBe('Start round 3');
    });

    it('returns "Pause" when status is running', () => {
      const state = createMockState({ status: 'running' });
      expect(nextActionLabel(state)).toBe('Pause');
    });

    it('returns "Resume" when status is paused', () => {
      const state = createMockState({ status: 'paused' });
      expect(nextActionLabel(state)).toBe('Resume');
    });
  });

  describe('awaitingNextTitle', () => {
    it('returns calm message asking if user is ready for round N', () => {
      expect(awaitingNextTitle(3)).toBe('Break over. Ready for round 3?');
      expect(awaitingNextTitle(2)).toBe('Break over. Ready for round 2?');
    });
  });

  describe('computeRoundDots', () => {
    it('computes dots for round 1 focus: 0 filled, 1 active', () => {
      const dots = computeRoundDots(4, 1, 'focus', 'running');
      expect(dots).toEqual([
        { index: 1, filled: false, active: true },
        { index: 2, filled: false, active: false },
        { index: 3, filled: false, active: false },
        { index: 4, filled: false, active: false },
      ]);
    });

    it('computes dots for round 1 break: 1 filled, none active', () => {
      const dots = computeRoundDots(4, 1, 'break', 'running');
      expect(dots).toEqual([
        { index: 1, filled: true, active: false },
        { index: 2, filled: false, active: false },
        { index: 3, filled: false, active: false },
        { index: 4, filled: false, active: false },
      ]);
    });

    it('computes dots for awaitingNext (after round 1 break): 1 filled, none active', () => {
      const dots = computeRoundDots(4, 1, 'break', 'awaitingNext');
      expect(dots).toEqual([
        { index: 1, filled: true, active: false },
        { index: 2, filled: false, active: false },
        { index: 3, filled: false, active: false },
        { index: 4, filled: false, active: false },
      ]);
    });

    it('computes dots for round 2 focus: 1 filled, 2 active', () => {
      const dots = computeRoundDots(4, 2, 'focus', 'running');
      expect(dots).toEqual([
        { index: 1, filled: true, active: false },
        { index: 2, filled: false, active: true },
        { index: 3, filled: false, active: false },
        { index: 4, filled: false, active: false },
      ]);
    });

    it('computes dots for long break (after all focus rounds): all filled', () => {
      const dots = computeRoundDots(4, 4, 'longBreak', 'running');
      expect(dots).toEqual([
        { index: 1, filled: true, active: false },
        { index: 2, filled: true, active: false },
        { index: 3, filled: true, active: false },
        { index: 4, filled: true, active: false },
      ]);
    });
  });

  describe('pomodoroFinishedSubtitle', () => {
    it('returns completed string when completed is true', () => {
      const sub = pomodoroFinishedSubtitle(4, 4, 100 * 60, true);
      expect(sub).toBe('4 rounds - 1h 40m focused');
    });

    it('handles single round completed', () => {
      const sub = pomodoroFinishedSubtitle(1, 1, 25 * 60, true);
      expect(sub).toBe('1 round - 25m focused');
    });

    it('returns stopped-early string with completed rounds count', () => {
      const sub = pomodoroFinishedSubtitle(2, 4, 50 * 60, false);
      expect(sub).toBe('2 of 4 rounds completed - 50m focused');
    });

    it('handles stopped-early with 0 rounds completed', () => {
      const sub = pomodoroFinishedSubtitle(0, 4, 10 * 60, false);
      expect(sub).toBe('0 of 4 rounds completed - 10m focused');
    });
  });

  describe('pomodoroStoppedEarlyText', () => {
    it('returns singular "1 round completed"', () => {
      expect(pomodoroStoppedEarlyText(1)).toBe('1 round completed');
    });

    it('returns plural "2 rounds completed"', () => {
      expect(pomodoroStoppedEarlyText(2)).toBe('2 rounds completed');
    });

    it('returns "0 rounds completed" when no round was finished', () => {
      expect(pomodoroStoppedEarlyText(0)).toBe('0 rounds completed');
    });
  });
});
