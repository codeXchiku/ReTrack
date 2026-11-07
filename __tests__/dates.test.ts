import {
  addDays,
  daysBetween,
  endOfDay,
  formatClock,
  formatDuration,
  startOfDay,
  startOfWeek,
  today,
  toDay,
} from '@/core/time';

describe('dates and time helpers', () => {
  describe('toDay and today', () => {
    it('formats epoch timestamp to YYYY-MM-DD', () => {
      // 2024-02-29 12:00:00 UTC
      const ts = new Date('2024-02-29T12:00:00Z').getTime();
      const expected = new Date(ts);
      const expectedStr = `${expected.getFullYear()}-${String(
        expected.getMonth() + 1,
      ).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      expect(toDay(ts)).toBe(expectedStr);
    });

    it('returns today string with optional clock or now timestamp', () => {
      const fixedTs = new Date('2025-06-15T10:30:00Z').getTime();
      const fixedDay = toDay(fixedTs);

      expect(today(fixedTs)).toBe(fixedDay);
      expect(today({ now: () => fixedTs })).toBe(fixedDay);
      expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('startOfDay and endOfDay', () => {
    it('calculates startOfDay and endOfDay accurately', () => {
      const ts = new Date('2024-08-20T14:45:10.500').getTime();
      const sod = startOfDay(ts);
      const eod = endOfDay(ts);

      const dStart = new Date(sod);
      expect(dStart.getHours()).toBe(0);
      expect(dStart.getMinutes()).toBe(0);
      expect(dStart.getSeconds()).toBe(0);
      expect(dStart.getMilliseconds()).toBe(0);

      const dEnd = new Date(eod);
      expect(dEnd.getHours()).toBe(23);
      expect(dEnd.getMinutes()).toBe(59);
      expect(dEnd.getSeconds()).toBe(59);
      expect(dEnd.getMilliseconds()).toBe(999);

      expect(eod - sod).toBe(86399999);
    });
  });

  describe('startOfWeek (Monday is day 1)', () => {
    it('always rolls back to Monday 00:00:00.000', () => {
      // 2024-11-04 is a Monday, 2024-11-06 is Wednesday, 2024-11-10 is Sunday
      const mondayTs = new Date('2024-11-04T10:00:00').getTime();
      const wednesdayTs = new Date('2024-11-06T18:30:00').getTime();
      const sundayTs = new Date('2024-11-10T22:00:00').getTime();

      const startFromWed = startOfWeek(wednesdayTs);
      const startFromSun = startOfWeek(sundayTs);
      const startFromMon = startOfWeek(mondayTs);

      expect(toDay(startFromWed)).toBe('2024-11-04');
      expect(toDay(startFromSun)).toBe('2024-11-04');
      expect(toDay(startFromMon)).toBe('2024-11-04');

      const d = new Date(startFromWed);
      expect(d.getDay()).toBe(1); // 1 = Monday
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
    });
  });

  describe('addDays', () => {
    it('handles positive and negative offsets', () => {
      expect(addDays('2024-05-10', 3)).toBe('2024-05-13');
      expect(addDays('2024-05-10', -3)).toBe('2024-05-07');
      expect(addDays('2024-05-10', 0)).toBe('2024-05-10');
    });

    it('handles month and year boundaries', () => {
      expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
      expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
      expect(addDays('2025-01-01', -1)).toBe('2024-12-31');
    });

    it('handles leap years accurately', () => {
      // 2024 is a leap year
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2024-02-29', 1)).toBe('2024-03-01');

      // 2023 is not a leap year
      expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    });
  });

  describe('daysBetween', () => {
    it('calculates days between two calendar dates', () => {
      expect(daysBetween('2024-05-01', '2024-05-01')).toBe(0);
      expect(daysBetween('2024-05-01', '2024-05-05')).toBe(4);
      expect(daysBetween('2024-05-05', '2024-05-01')).toBe(-4);
    });

    it('accounts for leap days across February and year boundaries', () => {
      expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2); // includes 2024-02-29
      expect(daysBetween('2023-02-28', '2023-03-01')).toBe(1); // non-leap year
      expect(daysBetween('2023-12-30', '2024-01-02')).toBe(3);
    });
  });

  describe('formatDuration', () => {
    it('formats seconds compactly', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(59)).toBe('59s');
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(1500)).toBe('25m');
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(4500)).toBe('1h 15m');
      expect(formatDuration(5400)).toBe('1h 30m');
    });

    it('handles negative inputs gracefully', () => {
      expect(formatDuration(-10)).toBe('0s');
    });
  });

  describe('formatClock', () => {
    it('formats epoch timestamp into HH:mm 24h format', () => {
      const d = new Date(2024, 5, 10, 14, 5, 0);
      expect(formatClock(d.getTime())).toBe('14:05');

      const dMorning = new Date(2024, 5, 10, 9, 8, 0);
      expect(formatClock(dMorning.getTime())).toBe('09:08');

      const dMidnight = new Date(2024, 5, 10, 0, 0, 0);
      expect(formatClock(dMidnight.getTime())).toBe('00:00');
    });
  });
});
