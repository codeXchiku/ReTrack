import { AppState } from 'react-native';
import { create } from 'zustand';
import { getDb } from '@/core/db';
import { eventBus } from '@/core/events';
import { today } from '@/core/time';
import { computeStreaks } from '../logic/streaks';
import type { StreaksResult } from '../logic/types';
import { getDailyTotals } from '../data/sessionsRepo';

export interface SessionsStoreState {
  todayFocusedSecs: number;
  streak: StreaksResult;
  revision: number;
  status: 'idle' | 'loading' | 'ready';
  refresh: () => Promise<void>;
}

export const useSessionsStore = create<SessionsStoreState>((set, get) => ({
  todayFocusedSecs: 0,
  streak: { current: 0, best: 0, todayQualified: false },
  revision: 0,
  status: 'idle',

  refresh: async () => {
    set({ status: 'loading' });
    try {
      const todayStr = today();
      const dailyTotals = await getDailyTotals();
      const todaySecs = dailyTotals[todayStr] ?? 0;
      const streak = computeStreaks(dailyTotals, todayStr);

      set({
        todayFocusedSecs: todaySecs,
        streak,
        revision: get().revision + 1,
        status: 'ready',
      });
    } catch {
      set({ status: 'ready' });
    }
  },
}));

let dayCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastKnownDay = today();
let listenersInitialized = false;

/**
 * Initializes listeners for:
 * 1. 'sessions/saved' event
 * 2. AppState active transitions
 * 3. Calendar day rollover
 */
export function setupSessionsListeners(): () => void {
  if (listenersInitialized) {
    return () => {};
  }
  listenersInitialized = true;

  const unsubEvent = eventBus.on('sessions/saved', () => {
    useSessionsStore.getState().refresh();
  });

  const unsubSubjectDeleted = eventBus.on(
    'subjects/deleted',
    async ({ subjectId }) => {
      try {
        await getDb().exec(
          'UPDATE sessions SET subject_id = NULL WHERE subject_id = ?;',
          [subjectId],
        );
      } catch {
        // ignore if table not ready or in mock env
      }
      useSessionsStore.getState().refresh();
    },
  );

  const appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      const currentDay = today();
      if (currentDay !== lastKnownDay) {
        lastKnownDay = currentDay;
      }
      useSessionsStore.getState().refresh();
    }
  });

  if (!dayCheckInterval) {
    dayCheckInterval = setInterval(() => {
      const currentDay = today();
      if (currentDay !== lastKnownDay) {
        lastKnownDay = currentDay;
        useSessionsStore.getState().refresh();
      }
    }, 30000);
  }

  return () => {
    listenersInitialized = false;
    unsubEvent();
    unsubSubjectDeleted();
    appStateSub.remove();
    if (dayCheckInterval) {
      clearInterval(dayCheckInterval);
      dayCheckInterval = null;
    }
  };
}
