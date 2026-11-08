import { daysBetween } from '@/core/time';

/**
 * Calculates days remaining until the given exam date.
 * Returns:
 * - null when examDay or todayDay is empty
 * - 0 on the exam day itself
 * - null when the exam day has already passed
 * - positive integer otherwise
 */
export function getDaysLeft(examDay: string, todayDay: string): number | null {
  if (!examDay || !todayDay) {
    return null;
  }
  const diff = daysBetween(todayDay, examDay);
  if (diff < 0) {
    return null;
  }
  return diff;
}

/**
 * Clamps daily goal minutes to the allowed range [15..720] in steps of 15 minutes.
 */
export function clampGoal(min: number): number {
  if (isNaN(min) || min < 15) {
    return 15;
  }
  if (min > 720) {
    return 720;
  }
  const stepped = Math.round(min / 15) * 15;
  return Math.min(720, Math.max(15, stepped));
}
