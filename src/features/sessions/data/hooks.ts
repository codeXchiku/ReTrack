import { useEffect, useState } from 'react';
import { useSessionsStore } from '../store/sessionsStore';
import { getDailyTotals, getSubjectTotals } from './sessionsRepo';
import type { StreaksResult } from '../logic/types';

/**
 * Returns the total focused seconds accumulated for today.
 * Refreshes automatically on session saves, app foreground, and day change.
 */
export function useTodayFocusedSecs(): number {
  const todaySecs = useSessionsStore(s => s.todayFocusedSecs);
  const status = useSessionsStore(s => s.status);

  useEffect(() => {
    if (status === 'idle') {
      useSessionsStore.getState().refresh();
    }
  }, [status]);

  return todaySecs;
}

/**
 * Returns the current and best streak along with today's qualification status.
 * Refreshes automatically on session saves, app foreground, and day change.
 */
export function useStreak(): StreaksResult {
  const streak = useSessionsStore(s => s.streak);
  const status = useSessionsStore(s => s.status);

  useEffect(() => {
    if (status === 'idle') {
      useSessionsStore.getState().refresh();
    }
  }, [status]);

  return streak;
}

/**
 * Returns daily totals (focused seconds per day) between fromDay and toDay.
 * Refreshes automatically on session saves, app foreground, and day change.
 */
export function useDailyTotals(
  fromDay: string,
  toDay: string,
): Record<string, number> {
  const revision = useSessionsStore(s => s.revision);
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    getDailyTotals(fromDay, toDay)
      .then(data => {
        if (active) {
          setTotals(data);
        }
      })
      .catch(() => {
        if (active) {
          setTotals({});
        }
      });

    return () => {
      active = false;
    };
  }, [fromDay, toDay, revision]);

  return totals;
}

/**
 * Returns focused seconds grouped by subject between fromDay and toDay (sorted by secs desc).
 * Refreshes automatically on session saves, app foreground, and day change.
 */
export function useSubjectTotals(
  fromDay: string,
  toDay: string,
): { subjectId: string | null; secs: number }[] {
  const revision = useSessionsStore(s => s.revision);
  const [totals, setTotals] = useState<
    { subjectId: string | null; secs: number }[]
  >([]);

  useEffect(() => {
    let active = true;
    getSubjectTotals(fromDay, toDay)
      .then(data => {
        if (active) {
          setTotals(data);
        }
      })
      .catch(() => {
        if (active) {
          setTotals([]);
        }
      });

    return () => {
      active = false;
    };
  }, [fromDay, toDay, revision]);

  return totals;
}
