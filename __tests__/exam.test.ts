import { clampGoal, getDaysLeft } from '@/features/settings/logic/exam';

describe('features/settings/logic/exam', () => {
  describe('getDaysLeft', () => {
    const today = '2026-11-08';

    it('returns 0 when exam date is today', () => {
      expect(getDaysLeft('2026-11-08', today)).toBe(0);
    });

    it('returns 1 when exam date is tomorrow', () => {
      expect(getDaysLeft('2026-11-09', today)).toBe(1);
    });

    it('returns 87 days for future date', () => {
      // 2026-11-08 + 87 days:
      // Nov has 30 days -> 22 days left in Nov (ends Nov 30)
      // Dec has 31 days -> 22 + 31 = 53 days (ends Dec 31)
      // Jan has 31 days -> 53 + 31 = 84 days (ends Jan 31)
      // Feb 3 -> 84 + 3 = 87 days -> 2027-02-03
      expect(getDaysLeft('2027-02-03', today)).toBe(87);
    });

    it('returns null for past dates', () => {
      expect(getDaysLeft('2026-11-07', today)).toBeNull();
      expect(getDaysLeft('2026-10-01', today)).toBeNull();
      expect(getDaysLeft('2025-11-08', today)).toBeNull();
    });

    it('returns null when exam date or today date is empty', () => {
      expect(getDaysLeft('', today)).toBeNull();
      expect(getDaysLeft('2026-12-01', '')).toBeNull();
      expect(getDaysLeft('', '')).toBeNull();
    });

    it('handles month boundary correctly', () => {
      expect(getDaysLeft('2026-12-01', '2026-11-30')).toBe(1);
      expect(getDaysLeft('2026-03-01', '2026-02-28')).toBe(1);
    });

    it('handles year boundary correctly', () => {
      expect(getDaysLeft('2027-01-01', '2026-12-31')).toBe(1);
      expect(getDaysLeft('2027-01-10', '2026-12-31')).toBe(10);
    });
  });

  describe('clampGoal', () => {
    it('clamps below minimum (15 min) to 15', () => {
      expect(clampGoal(0)).toBe(15);
      expect(clampGoal(-30)).toBe(15);
      expect(clampGoal(10)).toBe(15);
      expect(clampGoal(14)).toBe(15);
    });

    it('clamps above maximum (720 min / 12h) to 720', () => {
      expect(clampGoal(721)).toBe(720);
      expect(clampGoal(800)).toBe(720);
      expect(clampGoal(1440)).toBe(720);
    });

    it('rounds to nearest 15-minute step', () => {
      expect(clampGoal(15)).toBe(15);
      expect(clampGoal(20)).toBe(15);
      expect(clampGoal(23)).toBe(30);
      expect(clampGoal(30)).toBe(30);
      expect(clampGoal(120)).toBe(120);
      expect(clampGoal(115)).toBe(120);
      expect(clampGoal(105)).toBe(105);
      expect(clampGoal(110)).toBe(105);
    });

    it('handles NaN gracefully', () => {
      expect(clampGoal(NaN)).toBe(15);
    });
  });
});
