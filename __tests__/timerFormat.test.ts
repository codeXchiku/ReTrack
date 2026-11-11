import {
  formatClock,
  getStopDialogMessage,
  parseCustomMinutes,
} from '@/features/focus';

describe('timerFormat pure helpers', () => {
  describe('formatClock', () => {
    test('formats zero, negative, and invalid values as 00:00', () => {
      expect(formatClock(0)).toBe('00:00');
      expect(formatClock(-100)).toBe('00:00');
      expect(formatClock(NaN)).toBe('00:00');
      expect(formatClock(Infinity)).toBe('00:00');
    });

    test('formats seconds and minutes correctly', () => {
      expect(formatClock(45000)).toBe('00:45');
      expect(formatClock(65000)).toBe('01:05');
      expect(formatClock(15 * 60 * 1000)).toBe('15:00');
      expect(formatClock(30 * 60 * 1000)).toBe('30:00');
    });

    test('formats durations over an hour with single or double digit hours', () => {
      expect(formatClock(3723000)).toBe('1:02:03');
      expect(formatClock(10 * 3600 * 1000 + 5 * 60 * 1000 + 9000)).toBe('10:05:09');
    });

    test('rounds up for countdown and rounds down for stopwatch', () => {
      expect(formatClock(500, 'countdown')).toBe('00:01');
      expect(formatClock(500, 'stopwatch')).toBe('00:00');
      expect(formatClock(1200, 'stopwatch')).toBe('00:01');
    });
  });

  describe('getStopDialogMessage', () => {
    test('shows not saved warning for sessions under 30 seconds', () => {
      expect(getStopDialogMessage(0)).toBe(
        'End this session? Sessions under 30 seconds are not saved.',
      );
      expect(getStopDialogMessage(10)).toBe(
        'End this session? Sessions under 30 seconds are not saved.',
      );
      expect(getStopDialogMessage(29)).toBe(
        'End this session? Sessions under 30 seconds are not saved.',
      );
    });

    test('shows saved duration message for sessions >= 30 seconds', () => {
      expect(getStopDialogMessage(45)).toBe(
        'End this session? 45s of focus will be saved.',
      );
      expect(getStopDialogMessage(12 * 60)).toBe(
        'End this session? 12m of focus will be saved.',
      );
      expect(getStopDialogMessage(3660)).toBe(
        'End this session? 1h 1m of focus will be saved.',
      );
    });
  });

  describe('parseCustomMinutes', () => {
    test('rejects empty, non-numeric, zero, negative, decimal, and out-of-range values', () => {
      expect(parseCustomMinutes('').ok).toBe(false);
      expect(parseCustomMinutes('   ').ok).toBe(false);
      expect(parseCustomMinutes('abc').ok).toBe(false);
      expect(parseCustomMinutes('0').ok).toBe(false);
      expect(parseCustomMinutes('-5').ok).toBe(false);
      expect(parseCustomMinutes('3.5').ok).toBe(false);
      expect(parseCustomMinutes('601').ok).toBe(false);
    });

    test('accepts valid minute inputs between 1 and 600', () => {
      const res1 = parseCustomMinutes('1');
      expect(res1).toEqual({ ok: true, minutes: 1, focusMs: 60000 });

      const res90 = parseCustomMinutes('90');
      expect(res90).toEqual({ ok: true, minutes: 90, focusMs: 90 * 60000 });

      const res600 = parseCustomMinutes('  600  ');
      expect(res600).toEqual({ ok: true, minutes: 600, focusMs: 600 * 60000 });
    });
  });
});
