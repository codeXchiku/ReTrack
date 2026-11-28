import { planFor, STOPWATCH_CAP_MS } from '@/features/silence';

describe('silencePlan - planFor', () => {
  const NOW = 1_700_000_000_000;

  describe('focus/phaseStarted', () => {
    it('enters with event endsAt when phase is focus and silence is true', () => {
      const endsAt = NOW + 1500_000;
      expect(
        planFor(
          { type: 'focus/phaseStarted', phase: 'focus', endsAt, silence: true },
          { now: NOW },
        ),
      ).toEqual({ action: 'enter', endsAt });
    });

    it('uses now + 12h cap when phase is focus, endsAt is null (stopwatch), and silence is true', () => {
      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'focus',
            endsAt: null,
            silence: true,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'enter', endsAt: NOW + STOPWATCH_CAP_MS });
    });

    it('returns none (never enters) when phase is focus and silence is false', () => {
      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'focus',
            endsAt: NOW + 600_000,
            silence: false,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });
    });

    it('returns none when stopwatch has silence false', () => {
      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'focus',
            endsAt: null,
            silence: false,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });
    });

    it('exits when phase is break and silence is true', () => {
      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'break',
            endsAt: NOW + 300_000,
            silence: true,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'exit' });
    });

    it('exits when phase is longBreak and silence is true', () => {
      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'longBreak',
            endsAt: NOW + 900_000,
            silence: true,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'exit' });
    });

    it('returns none (never enters) when break/longBreak has silence false', () => {
      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'break',
            endsAt: NOW + 300_000,
            silence: false,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });

      expect(
        planFor(
          {
            type: 'focus/phaseStarted',
            phase: 'longBreak',
            endsAt: NOW + 900_000,
            silence: false,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });
    });
  });

  describe('focus/resumed', () => {
    it('enters with endsAt when resuming focus phase with silence true', () => {
      const endsAt = NOW + 120_000;
      expect(
        planFor(
          { type: 'focus/resumed', phase: 'focus', endsAt, silence: true },
          { now: NOW },
        ),
      ).toEqual({ action: 'enter', endsAt });
    });

    it('uses now + 12h cap when resuming stopwatch (endsAt null) with silence true', () => {
      expect(
        planFor(
          { type: 'focus/resumed', phase: 'focus', endsAt: null, silence: true },
          { now: NOW },
        ),
      ).toEqual({ action: 'enter', endsAt: NOW + STOPWATCH_CAP_MS });
    });

    it('returns none when resuming focus phase with silence false', () => {
      expect(
        planFor(
          {
            type: 'focus/resumed',
            phase: 'focus',
            endsAt: NOW + 120_000,
            silence: false,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });
    });

    it('returns none when resuming break or longBreak regardless of silence flag', () => {
      expect(
        planFor(
          {
            type: 'focus/resumed',
            phase: 'break',
            endsAt: NOW + 100_000,
            silence: true,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });

      expect(
        planFor(
          {
            type: 'focus/resumed',
            phase: 'longBreak',
            endsAt: NOW + 100_000,
            silence: true,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });

      expect(
        planFor(
          {
            type: 'focus/resumed',
            phase: 'break',
            endsAt: NOW + 100_000,
            silence: false,
          },
          { now: NOW },
        ),
      ).toEqual({ action: 'none' });
    });
  });

  describe('stop / pause / finish / awaitingNext', () => {
    it('returns exit for focus/paused', () => {
      expect(planFor({ type: 'focus/paused' }, { now: NOW })).toEqual({
        action: 'exit',
      });
    });

    it('returns exit for focus/stopped', () => {
      expect(planFor({ type: 'focus/stopped' }, { now: NOW })).toEqual({
        action: 'exit',
      });
    });

    it('returns exit for focus/finished', () => {
      expect(planFor({ type: 'focus/finished' }, { now: NOW })).toEqual({
        action: 'exit',
      });
    });

    it('returns exit for focus/awaitingNext', () => {
      expect(planFor({ type: 'focus/awaitingNext' }, { now: NOW })).toEqual({
        action: 'exit',
      });
    });
  });
});
