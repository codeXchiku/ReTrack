import { addDays, daysBetween } from '@/core/time';
import type { StreaksResult } from './types';

/**
 * Minimum focused seconds required for a calendar day to qualify towards a streak (10 minutes).
 */
export const STREAK_MIN_SECS = 600;

/**
 * Computes current and best study streaks from daily focused totals.
 *
 * Rules:
 * - A day counts when focused time >= minSecsPerDay (default 600s / 10m).
 * - current streak = consecutive qualifying days ending TODAY.
 * - If today has not qualified yet, count back from YESTERDAY
 *   (so streak is not shown as broken until the day is over).
 * - best = longest consecutive run of qualifying days in the data.
 */
export function computeStreaks(
  totalsByDay: Record<string, number>,
  today: string,
  minSecsPerDay: number = STREAK_MIN_SECS,
): StreaksResult {
  const todaySecs = totalsByDay[today] ?? 0;
  const todayQualified = todaySecs >= minSecsPerDay;

  // Calculate current streak
  let current = 0;
  let checkDay = today;

  if (todayQualified) {
    current = 1;
    checkDay = addDays(today, -1);
  } else {
    checkDay = addDays(today, -1);
  }

  while ((totalsByDay[checkDay] ?? 0) >= minSecsPerDay) {
    current += 1;
    checkDay = addDays(checkDay, -1);
  }

  // Calculate best streak across all qualifying days
  const qualifyingDays = Object.keys(totalsByDay)
    .filter(day => (totalsByDay[day] ?? 0) >= minSecsPerDay)
    .sort();

  let maxRun = 0;
  if (qualifyingDays.length > 0) {
    maxRun = 1;
    let currentRun = 1;

    for (let i = 1; i < qualifyingDays.length; i++) {
      const prev = qualifyingDays[i - 1]!;
      const curr = qualifyingDays[i]!;
      const diff = daysBetween(prev, curr);

      if (diff === 1) {
        currentRun += 1;
      } else if (diff > 1) {
        currentRun = 1;
      }

      if (currentRun > maxRun) {
        maxRun = currentRun;
      }
    }
  }

  const best = Math.max(maxRun, current);

  return {
    current,
    best,
    todayQualified,
  };
}
